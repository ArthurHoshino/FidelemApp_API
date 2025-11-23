import { Router } from "express";
import db from '../db/db.js';
import CDCARGOENUM from "../core/enums/cdcargo.enum.js";

const router = Router();

// <============================>
// Funções auxiliares
// <============================>
/**
 * Buscar o cargo de uma empresa pelo id
 * @param {Integer} codEmpresa Código da empresa
 * @param {Integer} cdcarid Id do registro a ser buscado
 */
async function getCargoById(codEmpresa, cdcarid) {
    try {
        const data = await db.query(
            `SELECT * FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCAREMPRESAID}" = $1 AND "${CDCARGOENUM.CDCARID}" = $2 ORDER BY "${CDCARGOENUM.CDCARID}" ASC`,
            [codEmpresa, cdcarid]
        );
        return data;
    } catch (err) {
        console.log(err.message);
        throw new Error(`Não foi possível buscar os registros de ${CDCARGOENUM.TABELA}`, {cause: err.message});
    }
}

/**
 * Buscar o cargo de uma empresa pelo id
 * @param {Integer} codEmpresa Código da empresa
 * @param {Integer} cdCarNome Nome do cargo a ser buscado
 */
async function getCargoByNomeDescricao(codEmpresa, cdCarNome) {
    try {
        const data = await db.query(
            `SELECT * FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCAREMPRESAID}" = $1 AND "${CDCARGOENUM.CDCARNOME}" = $2 ORDER BY "${CDCARGOENUM.CDCARID}" ASC`,
            [codEmpresa, cdCarNome]
        );
        return data;
    } catch (err) {
        console.log(err.message);
        throw new Error(`Não foi possível buscar os registros de ${CDCARGOENUM.TABELA}`, {cause: err.message});
    }
}

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    // Passar o cargo no formato: http://localhost:3000/cdcargo?cdcarempresaid=1
    const { cdcarempresaid } = req.query;

    if (!cdcarempresaid) {
        return res.status(400).json({ error: 'Empresa não informada' });
    }

    try {
        const { rows } = await db.query(
            `SELECT * FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCAREMPRESAID}" = $1 ORDER BY "${CDCARGOENUM.CDCARID}" ASC`,
            [codEmpresa]
        );
        res.json(rows);
    } catch (err) {
        console.error(`[Buscar cargos]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

router.get('/cdcarid', async (req, res) => {
    const { cdcarid, cdcarempresaid } = req.query;

    if (!cdcarid || !cdcarempresaid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await getCargoById(cdcarempresaid, cdcarid);

        if (rows === undefined) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`[Buscar cargos - id]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

router.get('/cdcarnome', async (req, res) => {
    const { cdcarempresaid, cdcarnome } = req.query;

    if (!cdcarempresaid || !cdcarnome) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await getCargoByNomeDescricao(cdcarempresaid, cdcarnome);

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

// <============================>
// Rotas POST
// <============================>
router.post('/', async (req, res) => {
    const { cdcarnome, cdcarempresaid } = req.body;

    if (!cdcarnome || !cdcarempresaid) {
        return res.status(400).json({ error: 'Existem dados obrigatórios faltantes' });
    }

    try {
        const { rows } = await getCargoByNomeDescricao(cdcarempresaid, cdcarnome);

        if (rows.length > 0) {
            return res.status(400).json({ error: 'Cargo já está cadastrado' });
        }

        await db.query(
            `INSERT INTO "CDCARGO" ("CDCARNOME", "CDCAREMPRESAID") VALUES ($1, $2)`,
            [cdcarnome, cdcarempresaid]
        );

        res.status(201).send();
    } catch (err) {
        console.error(`[Adicionar cargo]: ${err.message}\n`);
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
        const { rows } = await getCargoById(data['cdcarempresaid'], data['cdcarid']);

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        await db.query(
            `UPDATE "CDCARGO"
            SET "CDCARNOME" = $1,
            WHERE "CDCARID" = $2`,
            [data['cdcarnome'], data['cdcarid']]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar cargo]: ${err.message}\n`);
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
    const { cdcarempresaid, cdcarid } = req.body;

    if (!cdcarempresaid || !cdcarid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await getCargoById(cdcarempresaid, cdcarid);

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        await db.query(
            `DELETE FROM "CDCARGO" WHERE "CDCAREMPRESAID" = $1 AND "CDCARID" = $2`,
            [cdcarempresaid, cdcarid]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar cargo]: ${err.message}\n`);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
})

export default router;