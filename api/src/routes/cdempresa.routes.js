import { Router } from "express";
import db from '../db/db.js';
import CDEMPRESAENUM from '../core/enums/cdempresa.enum.js';
import { getAllEntidades, getEntidadeById, getEntidadeByNomeDescricao } from '../core/utils.js';

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    try {
        const { rows } = await getAllEntidades(CDEMPRESAENUM.TABELA, CDEMPRESAENUM.CDEMPID);
        res.json(rows);
    } catch (err) {
        console.error(`[Buscar empresas]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

router.get('/cdempid', async (req, res) => {
    const { empresa } = req.query;
    try {
        const { rows } = await getEntidadeById(CDEMPRESAENUM.TABELA, CDEMPRESAENUM.CDEMPID, empresa);

        if (rows === undefined) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`[Buscar empresas - id]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

router.get('/cdempnome', async (req, res) => {
    const { cdempnome } = req.query;
    try {
        const { rows } = await getEntidadeByNomeDescricao(CDEMPRESAENUM.TABELA, CDEMPRESAENUM.CDEMPNOME, cdempnome);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`[Buscar empresas - nome]: ${err.message}\n`);
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
    const { cdempnome } = req.body;

    if (!cdempnome) {
        return res.status(400).json({ error: 'O  campo "empresa" é obrigatório' });
    }

    try {
        const { rows } = await getEntidadeByNomeDescricao(CDEMPRESAENUM.TABELA, CDEMPRESAENUM.CDEMPNOME, cdempnome);

        if (rows.length > 0) {
            return res.status(400).json({ error: 'Empresa já está cadastrada' });
        }

        await db.query(
            `INSERT INTO "CDEMPRESA" ("CDEMPNOME") VALUES ($1)`,
            [cdempnome]
        );

        res.status(201).send();
    } catch (err) {
        console.error(`[Adicionar empresa]: ${err.message}\n`);
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

    if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'Necessário informar os dados para atualização' });
    }

    try {
        const { rows } = await getEntidadeById(CDEMPRESAENUM.TABELA, CDEMPRESAENUM.CDEMPID, data['cdempid']);

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        await db.query(
            `UPDATE "CDEMPRESA"
            SET "CDEMPNOME" = $1
            WHERE "CDEMPID" = $2`,
            [data['cdempnome'], data['cdempid']]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar empresa]: ${err.message}\n`);
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
    const { cdempid } = req.body;

    if (!cdempid) {
        return res.status(400).json({ error: 'O  campo "id" é obrigatório' });
    }

    try {
        const { rows } = await getEntidadeById(CDEMPRESAENUM.TABELA, CDEMPRESAENUM.CDEMPID, cdempid);

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }

        await db.query(
            `DELETE FROM "CDEMPRESA" WHERE "CDEMPID" = $1`,
            [cdempid]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar empresa]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
})

// Exporta as rotas
export default router;