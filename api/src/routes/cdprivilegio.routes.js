import { Router } from "express";
import db from '../db/db.js';
import CDPRIVILEGIOENUM from "../core/enums/cdprivilegio.enum.js";
import { registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    try {
        const select = `SELECT * FROM "${CDPRIVILEGIOENUM.TABELA}" ORDER BY "${CDPRIVILEGIOENUM.CDPRIVMODULO}", "${CDPRIVILEGIOENUM.CDPRIVID}"`;
        const { rows } = await db.query(select);
        res.json(rows);
    } catch (err) {
        console.error(`[Buscar privilegios]: ${err.message}\n`);
        // Aqui não temos empresaId específico, podemos registrar como genérico ou omitir
        registraExcecao(err.stack, 0); 
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;
