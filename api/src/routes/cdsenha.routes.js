import { Router } from "express";
import db from '../db/db.js';
import CDSENHAENUM from '../core/enums/cdsenha.enum.js';
import {
    getAllEntidades,
    getEntidadeById,
    getEntidadeByNomeDescricao
} from '../core/utils.js';

const router = Router();

// <============================>
// Funções auxiliares
// <============================>


// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    // TODO fazer buscar do cargo -> empresa
    const { cdseempresaid } = req.query;

    if (!cdseempresaid) {
        return res.status(400).json({ error: 'Empresa não informada' });
    }

    try {
        const { rows } = await db.query();
        res.json(rows);
    } catch (err) {
        console.error(`[Buscar usuário]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

router.get('/cdcarid/:cdcarid', async (req, res) => {
    const { cdcarid } = req.params;
    try {
        const { rows } = await getEntidadeById(CDSENHAENUM.TABELA, CDSENHAENUM.CDSEID, cdcarid);

        if (rows === undefined) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`[Buscar usuários - id]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

router.get('/cdcarnome/:cdcarnome', async (req, res) => {
    const { cdcarnome } = req.params;
    try {
        const { rows } = await getEntidadeByNomeDescricao(CDSENHAENUM.TABELA, CDSENHAENUM.CDSENOME, cdcarnome);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`[Buscar cargos - nome]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;