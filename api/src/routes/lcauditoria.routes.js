import { Router } from "express";
import { registraAuditoria } from "../core/utils.js";
import db from "../db/db.js";
import LCAUDITORIAENUM from "../core/enums/lcauditoria.enum.js";
import { registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
/**
 * Rota para buscar as últimas 3 consultas realizadas pelo usuário para determinada empresa
 * Utilizada para exibir "Últimos Buscados" na Home
 */
router.get('/ultimas-consultas', async (req, res) => {
    const { lcaudsenhaid, lcaudempresaid, lcaudacaoid } = req.query;

    if (!lcaudsenhaid || !lcaudempresaid || !lcaudacaoid) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes: lcaudsenhaid, lcaudempresaid, lcaudacaoid' });
    }

    try {
        const { rows } = await db.query(
            `SELECT "${LCAUDITORIAENUM.LCAUDID}", "${LCAUDITORIAENUM.LCAUDDESCRICAO}", "${LCAUDITORIAENUM.LCAUDDATA}"
            FROM "${LCAUDITORIAENUM.TABELA}"
            WHERE "${LCAUDITORIAENUM.LCAUDSENHAID}" = $1 
            AND "${LCAUDITORIAENUM.LCAUDEMPRESAID}" = $2 
            AND "${LCAUDITORIAENUM.LCAUDACAOID}" = $3
            ORDER BY "${LCAUDITORIAENUM.LCAUDDATA}" DESC
            LIMIT 3`,
            [lcaudsenhaid, lcaudempresaid, lcaudacaoid]
        );

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