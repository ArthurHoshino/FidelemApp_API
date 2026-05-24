import { Router } from "express";
import db from '../db/db.js';
import CDCARGOENUM from "../core/enums/cdcargo.enum.js";
import CDEMPRESAENUM from "../core/enums/cdempresa.enum.js";
import { montaInsert, montaUpdate, montaWhere, registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    // Passar o cargo no formato: http://localhost:3000/cdcargo?cdcarempresaid=1
    const data = req.query;

    if (!data['cdcarempresaid']) {
        return res.status(400).json({ error: 'Empresa não informada' });
    }

    try {
        let { rows } = await db.query(
            `SELECT 1 FROM "${CDEMPRESAENUM.TABELA}" WHERE "${CDEMPRESAENUM.CDEMPID}" = $1`,
            [data['cdcarempresaid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Empresa não cadastrada' });
        }

        const colunas = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            if (key === 'cdcarempresaid') continue;

            colunas.push(CDCARGOENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        colunas.push(CDCARGOENUM.CDCAREMPRESAID);
        parametros.push(data['cdcarempresaid']);

        const select = `SELECT "${CDCARGOENUM.TABELA}".* FROM "${CDCARGOENUM.TABELA}" JOIN "${CDEMPRESAENUM.TABELA}" ON "${CDEMPRESAENUM.CDEMPID}" = "${CDCARGOENUM.CDCAREMPRESAID}" ` + montaWhere(colunas);
        ({ rows } = await db.query(select, parametros))

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar cargos]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdcarempresaid']);
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

    if (!data['cdcarnome'] || !data['cdcarempresaid']) {
        return res.status(400).json({ error: 'Existem dados obrigatórios faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCARNOME}" = $1 AND "${CDCARGOENUM.CDCAREMPRESAID}" = $2`,
            [data['cdcarnome'], data['cdcarempresaid']]
        );

        if (rows.length > 0) {
            return res.status(400).json({ error: 'Cargo já está cadastrado' });
        }

        await db.query(montaInsert(CDCARGOENUM), Object.values(data));

        res.status(201).send();
    } catch (err) {
        console.error(`[Adicionar cargo]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdcarempresaid']);
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
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCAREMPRESAID}" = $1 AND "${CDCARGOENUM.CDCARID}" = $2`,
            [data['cdcarempresaid'], data['cdcarid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        const colunas = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            if (CDCARGOENUM[key.toUpperCase()] === undefined) continue;
            if (key === 'cdcarid') continue;

            colunas.push(CDCARGOENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        colunas.push(CDCARGOENUM.CDCARID);
        parametros.push(data['cdcarid']);

        await db.query(`UPDATE "${CDCARGOENUM.TABELA}" ` + montaUpdate(colunas), parametros);

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar cargo]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdcarempresaid']);
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

    if (!data['cdcarempresaid'] || !data['cdcarid']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCAREMPRESAID}" = $1 AND "${CDCARGOENUM.CDCARID}" = $2`,
            [data['cdcarempresaid'], data['cdcarid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        await db.query(`DELETE FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCARID}" = $1 AND "${CDCARGOENUM.CDCAREMPRESAID}" = $2`, Object.values(data));

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar cargo]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdcarempresaid']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
})

export default router;