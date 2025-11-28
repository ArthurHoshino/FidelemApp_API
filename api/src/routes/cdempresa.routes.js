import { Router } from "express";
import db from '../db/db.js';
import CDEMPRESAENUM from '../core/enums/cdempresa.enum.js';
import { getAllEntidades, getEntidadeById, getEntidadeByNomeDescricao, montaUpdate, montaWhere } from '../core/utils.js';

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
            colunas.push(CDEMPRESAENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        const select = `SELECT * FROM "${CDEMPRESAENUM.TABELA}" ` + montaWhere(colunas);

        const { rows } = await db.query(select, parametros);

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar empresas]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdempid']);
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
    const { cdempid, cdempnome } = req.body;

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
        registraExcecao(err.stack, cdempid);
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

        await db.query(`UPDATE "${CDEMPRESAENUM.TABELA}" SET "${CDEMPRESAENUM.CDEMPNOME}" = $1 WHERE "${CDEMPRESAENUM.CDEMPID}" = $2`, [data['cdempnome'], data['cdempid']]);

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar empresa]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdempid']);
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
        registraExcecao(err.stack, cdempid);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
})

// Exporta as rotas
export default router;