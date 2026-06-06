import { Router } from "express";
import db from "../db/db.js";
import LCCARRINHOENUM from "../core/enums/lccarrinho.enum.js";
import { montaInsert, montaUpdate, montaWhere, registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    try {
        const colunas = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            const enumKey = key.toUpperCase();
            if (LCCARRINHOENUM[enumKey]) {
                colunas.push(LCCARRINHOENUM[enumKey]);
                parametros.push(value);
            }
        }

        let select = `SELECT "${LCCARRINHOENUM.TABELA}".* FROM "${LCCARRINHOENUM.TABELA}"`;
        if (colunas.length > 0) {
            select += ' ' + montaWhere(colunas);
        }
        
        const { rows } = await db.query(select, parametros);
        res.json(rows);
    } catch (err) {
        console.error(`[Buscar carrinho]: ${err.message}\n`);
        const empresaId = data['lccarempresaid'] ? parseInt(data['lccarempresaid']) : 0;
        registraExcecao(err.stack, empresaId);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas POST
// <============================>
router.post('/', async (req, res) => {
    const data = req.body;

    if (!data['lccarsenhaid'] || !data['lccarprodutoid'] || !data['lccarquantidade'] || !data['lccarempresaid']) {
        return res.status(400).json({ error: 'Existem dados obrigatórios faltantes' });
    }

    try {
        // Verificar se já existe esse produto no carrinho para este usuário e empresa
        const { rows } = await db.query(
            `SELECT * FROM "${LCCARRINHOENUM.TABELA}" 
             WHERE "${LCCARRINHOENUM.LCCARSENHAID}" = $1 
             AND "${LCCARRINHOENUM.LCCARPRODUTOID}" = $2 
             AND "${LCCARRINHOENUM.LCCAREMPRESAID}" = $3`,
            [data['lccarsenhaid'], data['lccarprodutoid'], data['lccarempresaid']]
        );

        if (rows.length > 0) {
            const novoItem = rows[0];
            const novaQtd = parseInt(data['lccarquantidade']);
            await db.query(
                `UPDATE "${LCCARRINHOENUM.TABELA}" SET "${LCCARRINHOENUM.LCCARQUANTIDADE}" = $1 WHERE "${LCCARRINHOENUM.LCCARID}" = $2`,
                [novaQtd, novoItem.LCCARID]
            );
            return res.status(200).json({ 
                message: 'Quantidade atualizada', 
                item: { ...novoItem, LCCARQUANTIDADE: novaQtd } 
            });
        }

        const insertQuery = montaInsert(LCCARRINHOENUM, true);
        const values = [
            data['lccarsenhaid'],
            data['lccarprodutoid'],
            data['lccarquantidade'],
            data['lccarempresaid']
        ];
        
        const result = await db.query(insertQuery, values);
        res.status(201).json(result.rows[0] || {});
    } catch (err) {
        console.error(`[Adicionar carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, data['lccarempresaid'] || 0);
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

    if (!data['lccarid'] || !data['lccarquantidade']) {
        return res.status(400).json({ error: 'Existem dados obrigatórios faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${LCCARRINHOENUM.TABELA}" WHERE "${LCCARRINHOENUM.LCCARID}" = $1`,
            [data['lccarid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Item do carrinho não encontrado' });
        }

        await db.query(
            `UPDATE "${LCCARRINHOENUM.TABELA}" SET "${LCCARRINHOENUM.LCCARQUANTIDADE}" = $1 WHERE "${LCCARRINHOENUM.LCCARID}" = $2`,
            [data['lccarquantidade'], data['lccarid']]
        );

        res.status(200).json({ message: 'Item atualizado com sucesso' });
    } catch (err) {
        console.error(`[Atualizar carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, data['lccarempresaid'] || 0);
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
    const data = req.body;
    const lccarid = data['lccarid'] || req.query['lccarid'];
    const lccarsenhaid = data['lccarsenhaid'] || req.query['lccarsenhaid'];
    const lccarempresaid = data['lccarempresaid'] || req.query['lccarempresaid'];

    if (!lccarid && (!lccarsenhaid || !lccarempresaid)) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    try {
        if (lccarid) {
            const { rows } = await db.query(
                `SELECT 1 FROM "${LCCARRINHOENUM.TABELA}" WHERE "${LCCARRINHOENUM.LCCARID}" = $1`,
                [lccarid]
            );

            if (rows.length <= 0) {
                return res.status(404).json({ error: 'Item do carrinho não encontrado' });
            }

            await db.query(
                `DELETE FROM "${LCCARRINHOENUM.TABELA}" WHERE "${LCCARRINHOENUM.LCCARID}" = $1`,
                [lccarid]
            );
        } else {
            await db.query(
                `DELETE FROM "${LCCARRINHOENUM.TABELA}" WHERE "${LCCARRINHOENUM.LCCARSENHAID}" = $1 AND "${LCCARRINHOENUM.LCCAREMPRESAID}" = $2`,
                [lccarsenhaid, lccarempresaid]
            );
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, lccarempresaid || 0);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;
