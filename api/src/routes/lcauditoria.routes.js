import { Router } from "express";
import { registraAuditoria } from "../core/utils.js";
import db from "../db/db.js";
import LCAUDITORIAENUM from "../core/enums/lcauditoria.enum.js";
import CDPRODUTOENUM from "../core/enums/cdproduto.enum.js";
import CDPRODUTOIMAGEMENUM from "../core/enums/cdprodutoimagem.enum.js";
import ACAOCOD from "../core/enums/acaoCod.enum.js";
import { registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
/**
 * Rota para buscar as últimas 3 consultas realizadas pelo usuário para determinada empresa
 * Utilizada para exibir "Últimos Buscados" na Home
 * 
 * Para produtos: usa lcaudacaoid = 14 (Buscar produto individual) e faz JOIN com CDPRODUTO
 * Para outras ações: usa o lcaudacaoid informado e retorna apenas dados da auditoria
 */
router.get('/ultimas-consultas', async (req, res) => {
    const { lcaudsenhaid, lcaudempresaid, lcaudacaoid } = req.query;

    if (!lcaudsenhaid || !lcaudempresaid || !lcaudacaoid) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes: lcaudsenhaid, lcaudempresaid, lcaudacaoid' });
    }

    try {
        // Se for busca de produtos individuais (código 14), faz JOIN com CDPRODUTO para retornar dados completos
        const isBuscaProdutoIndividual = parseInt(lcaudacaoid) === ACAOCOD['Buscar produto individual'];
        
        let query;
        let params = [lcaudsenhaid, lcaudempresaid, lcaudacaoid];

        if (isBuscaProdutoIndividual) {
            // Query com JOIN para retornar dados completos do produto
            // DISTINCT ON garante que cada produto apareça apenas uma vez (a busca mais recente)
            query = `
                SELECT DISTINCT ON ("${CDPRODUTOENUM.CDPRODID}")
                    "${CDPRODUTOENUM.TABELA}".*,
                    "${CDPRODUTOIMAGEMENUM.TABELA}".*,
                    "${LCAUDITORIAENUM.LCAUDDATA}"
                FROM "${LCAUDITORIAENUM.TABELA}"
                JOIN "${CDPRODUTOENUM.TABELA}" ON "${CDPRODUTOENUM.CDPRODID}" = "${LCAUDITORIAENUM.LCAUDPRODUTOID"
                LEFT JOIN "${CDPRODUTOIMAGEMENUM.TABELA}" ON "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = "${CDPRODUTOENUM.CDPRODID}"
                WHERE "${LCAUDITORIAENUM.LCAUDSENHAID}" = $1 
                AND "${LCAUDITORIAENUM.LCAUDEMPRESAID}" = $2 
                AND "${LCAUDITORIAENUM.LCAUDACAOID}" = $3
                AND "${LCAUDITORIAENUM.LCAUDPRODUTOID}" IS NOT NULL
                ORDER BY "${CDPRODUTOENUM.CDPRODID}", "${LCAUDITORIAENUM.LCAUDDATA}" DESC
                LIMIT 3
            `;
        } else {
            // Query padrão para outras ações
            query = `
                SELECT "${LCAUDITORIAENUM.LCAUDID}", "${LCAUDITORIAENUM.LCAUDDESCRICAO}", "${LCAUDITORIAENUM.LCAUDDATA}"
                FROM "${LCAUDITORIAENUM.TABELA}"
                WHERE "${LCAUDITORIAENUM.LCAUDSENHAID}" = $1 
                AND "${LCAUDITORIAENUM.LCAUDEMPRESAID}" = $2 
                AND "${LCAUDITORIAENUM.LCAUDACAOID}" = $3
                ORDER BY "${LCAUDITORIAENUM.LCAUDDATA}" DESC
                LIMIT 3
            `;
        }

        const { rows } = await db.query(query, params);

        // Se for busca de produtos, transforma imagens em base64
        if (isBuscaProdutoIndividual) {
            rows.forEach(item => {
                if (item[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB] !== null) {
                    item[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB] = item[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB].toString('base64');
                }
            });
        }

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar últimas consultas]: ${err.message}\n`);
        registraExcecao(err.stack, lcaudempresaid);
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
    const { lcauddescricao, lcaudacaoid, lcaudempresaid, lcaudsenhaid } = req.body;

    if (!lcauddescricao || !lcaudacaoid || !lcaudempresaid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await registraAuditoria(lcauddescricao, lcaudacaoid, lcaudempresaid, lcaudsenhaid || null);

        res.status(201).send();
    } catch (err) {
        console.error(`[Inserir auditoria]: ${err.message}\n`);
        registraExcecao(err.stack, lcaudempresaid);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;