import { Router } from "express";
import { montaWhere, montaInsert, montaUpdate, registraExcecao, registraAuditoria } from "../core/utils.js";
import LCVENDAENUM from '../core/enums/lcvenda.enum.js';
import CDSENHAENUM from "../core/enums/cdsenha.enum.js";
import db from "../db/db.js";

const router = Router();

// <============================>
// Rota de finalização de venda e carrinho com transação e validação de estoque
// <============================>
router.post('/finalizar', async (req, res) => {
    const { lcvensenhaid, lccarempresaid, metodopagamento } = req.body;

    if (!lcvensenhaid || !lccarempresaid) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes: lcvensenhaid e lccarempresaid' });
    }

    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Buscar itens do carrinho
        const cartResult = await client.query(
            `SELECT * FROM "LCCARRINHO" WHERE "LCCARSENHAID" = $1 AND "LCCAREMPRESAID" = $2`,
            [lcvensenhaid, lccarempresaid]
        );

        if (cartResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ error: 'O carrinho está vazio' });
        }

        // Validar estoque para todos os produtos
        for (const cartItem of cartResult.rows) {
            const prodId = cartItem.LCCARPRODUTOID;
            const requestedQty = cartItem.LCCARQUANTIDADE;

            const prodResult = await client.query(
                `SELECT * FROM "CDPRODUTO" WHERE "CDPRODID" = $1 FOR UPDATE`,
                [prodId]
            );

            if (prodResult.rows.length === 0) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(404).json({ error: `Produto com ID ${prodId} não encontrado` });
            }

            const product = prodResult.rows[0];
            const currentStock = product.CDPRODQTDESTOQUE || 0;

            if (currentStock < requestedQty) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(400).json({ 
                    error: `Estoque insuficiente para o produto "${product.CDPRODNOME}". Disponível: ${currentStock}, solicitado: ${requestedQty}` 
                });
            }
        }

        // Se todos passarem na validação, realiza a venda (um registro consolidado), deduz estoque e limpa o carrinho
        const produtosArray = cartResult.rows.map(cartItem => ({
            cdprodid: cartItem.LCCARPRODUTOID,
            quantidade: cartItem.LCCARQUANTIDADE
        }));

        // 1. Registrar a venda na LCVENDA (registro único para todos os produtos)
        const infoVenda = JSON.stringify(produtosArray);
        const insertVendaResult = await client.query(
            `INSERT INTO "LCVENDA" ("LCVENSENHAID", "LCVENPRODUTOS", "LCVENDATA") VALUES ($1, $2, NOW()) RETURNING "LCVENID"`,
            [lcvensenhaid, infoVenda]
        );
        const vendaId = insertVendaResult.rows[0].LCVENID;

        // 2. Deduzir o estoque para cada produto, calcular totais e limpar carrinho
        let totalReais = 0;
        let totalPontos = 0;

        for (const cartItem of cartResult.rows) {
            const prodResult = await client.query(
                `SELECT * FROM "CDPRODUTO" WHERE "CDPRODID" = $1`,
                [cartItem.LCCARPRODUTOID]
            );
            const product = prodResult.rows[0];
            totalReais += Number(product.CDPRODPRECOREAL || 0) * cartItem.LCCARQUANTIDADE;
            totalPontos += Number(product.CDPRODPRECOPONTO || 0) * cartItem.LCCARQUANTIDADE;

            await client.query(
                `UPDATE "CDPRODUTO" SET "CDPRODQTDESTOQUE" = "CDPRODQTDESTOQUE" - $1 WHERE "CDPRODID" = $2`,
                [cartItem.LCCARQUANTIDADE, cartItem.LCCARPRODUTOID]
            );
        }

        // 3. Atualizar carteira de pontos do usuário
        const userResult = await client.query(
            `SELECT "${CDSENHAENUM.CDSEPONTOS}" FROM "${CDSENHAENUM.TABELA}" WHERE "${CDSENHAENUM.CDSEID}" = $1 FOR UPDATE`,
            [lcvensenhaid]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const currentPoints = userResult.rows[0].CDSEPONTOS || 0;

        if (metodopagamento === 'pontos') {
            if (currentPoints < totalPontos) {
                await client.query('ROLLBACK');
                client.release();
                return res.status(400).json({ 
                    error: `Saldo de pontos insuficiente. Você possui ${currentPoints} pontos, mas precisa de ${totalPontos} para esta compra.` 
                });
            }
            // Deduz os pontos do saldo
            await client.query(
                `UPDATE "${CDSENHAENUM.TABELA}" SET "${CDSENHAENUM.CDSEPONTOS}" = "${CDSENHAENUM.CDSEPONTOS}" - $1 WHERE "${CDSENHAENUM.CDSEID}" = $2`,
                [totalPontos, lcvensenhaid]
            );
        } else {
            // Regra simples: R$ 1.00 gasto = 1 ponto ganho (arredondado para baixo)
            const earnedPoints = Math.floor(totalReais);
            if (earnedPoints > 0) {
                await client.query(
                    `UPDATE "${CDSENHAENUM.TABELA}" SET "${CDSENHAENUM.CDSEPONTOS}" = "${CDSENHAENUM.CDSEPONTOS}" + $1 WHERE "${CDSENHAENUM.CDSEID}" = $2`,
                    [earnedPoints, lcvensenhaid]
                );
            }
        }

        // 4. Limpar o carrinho
        await client.query(
            `DELETE FROM "LCCARRINHO" WHERE "LCCARSENHAID" = $1 AND "LCCAREMPRESAID" = $2`,
            [lcvensenhaid, lccarempresaid]
        );

        await client.query('COMMIT');
        client.release();

        // 4. Registrar auditoria após commit
        const pagouComPontos = (metodopagamento === 'pontos');
        const acaoId = pagouComPontos ? 5 : 6; // 5: RESGATE_RECOMPENSA, 6: REALIZACAO_VENDA
        const acaoNome = pagouComPontos ? "Resgate de Recompensa" : "Venda";
        const descLog = `${acaoNome} realizada. Venda Nº ${vendaId} (Método: ${metodopagamento || 'Não Informado'}). Total: R$ ${totalReais.toFixed(2)}, Pontos: ${totalPontos}`;
        
        await registraAuditoria(descLog, acaoId, lccarempresaid);
        
        res.status(200).json({ message: 'Venda realizada e carrinho finalizado com sucesso' });
    } catch (err) {
        await client.query('ROLLBACK');
        client.release();
        console.error(`[Finalizar venda]: ${err.message}\n`);
        registraExcecao(err.stack, lccarempresaid);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    if (!data['empresa'] || !data['lcvenid'] || !data['lcvensenhaid']) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    try {
        const parametros = [data['lcvenid'], data['lcvensenhaid']];

        const select = `SELECT "${LCVENDAENUM.TABELA}".* FROM "${LCVENDAENUM.TABELA}"
                        JOIN "${CDSENHAENUM.TABELA}" ON "${CDSENHAENUM.CDSEID}" = "${LCVENDAENUM.LCVENSENHAID}"
                        WHERE ${LCVENDAENUM.LCVENID} = $1 AND ${LCVENDAENUM.LCVENSENHAID} = $2`;
        
        const { rows } = await db.query(select, parametros);

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar vendas]: ${err.message}\n`);
        registraExcecao(err.stack, data['empresa']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas POST (Simples)
// <============================>
router.post('/', async (req, res) => {
    const data = req.body;

    if (!data['lcvensenhaid'] || !data['lcvenprodutos']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await db.query(montaInsert(LCVENDAENUM), Object.values(data));

        res.status(204).send();
    } catch (err) {
        console.error(`[Inserir venda]: ${err.message}\n`);
        registraExcecao(err.stack, data['empresa'] || 0);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas PUT
// <============================>
router.put('/', async (req, res) => {
    const data = req.body;

    if (!data['empresa'] || !data['lcvensenhaid'] || !data['lcvenprodutos']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${LCVENDAENUM.TABELA}" WHERE "${LCVENDAENUM.LCVENID}" = $1 AND "${LCVENDAENUM.LCVENSENHAID}" = $2`,
            [data['lcvenid'], data['lcvensenhaid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        await db.query(
            `UPDATE "${LCVENDAENUM.TABELA}" SET "${LCVENDAENUM.LCVENPRODUTOS}" = $1
            WHERE "${LCVENDAENUM.LCVENID}" = $2 AND "${LCVENDAENUM.LCVENSENHAID}" = $3`,
            [data['lcvenprodutos'], data['lcvenid'], data['lcvensenhaid']]
        );

        res.status(201).send();
    } catch (err) {
        console.error(`[Atualizar venda]: ${err.message}\n`);
        registraExcecao(err.stack, data['empresa']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas DELETE
// <============================>
router.delete('/', async (req, res) => {
    const { empresa, lcvenid, lcvensenhaid } = req.body;

    if (!empresa || !lcvenid || !lcvensenhaid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${LCVENDAENUM.TABELA}" WHERE "${LCVENDAENUM.LCVENID}" = $1 AND "${LCVENDAENUM.LCVENSENHAID}" = $2`,
            [lcvenid, lcvensenhaid]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        await db.query(
            `DELETE FROM "${LCVENDAENUM.TABELA}" WHERE "${LCVENDAENUM.LCVENID}" = $1 AND "${LCVENDAENUM.LCVENSENHAID}" = $2`,
            [lcvenid, lcvensenhaid]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar venda]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    } 
});

export default router;