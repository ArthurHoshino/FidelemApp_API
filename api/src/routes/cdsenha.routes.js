import { Router } from "express";
import db from '../db/db.js';
import CDCARGOENUM from "../core/enums/cdcargo.enum.js";
import CDEMPRESAENUM from '../core/enums/cdempresa.enum.js';
import CDSENHAENUM from '../core/enums/cdsenha.enum.js';
import { montaInsert, montaUpdate, montaWhere, registraExcecao } from '../core/utils.js';

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    if (!data['empresa']) {
        return res.status(400).json({ error: 'Empresa não informada' });
    }

    try {
        const colunasCondicoes = [CDEMPRESAENUM.CDEMPID];
        const parametros = [data['empresa']];
        let condicaoSemCargo = "";

        for (const [key, value] of Object.entries(data)) {
            if (key === 'empresa' || key === 'not_cargo') continue;

            colunasCondicoes.push(CDSENHAENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        if (data['not_cargo']) {
            condicaoSemCargo = ` AND "CDCARGO"."CDCARNOME" != $${parametros.length + 1}`;
            parametros.push(data['not_cargo']);
        }

        const select = `SELECT "CDSENHA".*, "CDCARGO"."CDCARNOME", "CDEMPRESA"."CDEMPNOME" FROM "CDSENHA"
            JOIN "CDCARGO" ON "CDCARID" = "CDSECARGOID"
            JOIN "CDEMPRESA" ON "CDEMPID" = "CDCAREMPRESAID" ` + montaWhere(colunasCondicoes) + condicaoSemCargo;

        const { rows } = await db.query(select, parametros);
        res.json(rows);
    } catch (err) {
        console.error(`[Buscar usuário]: ${err.message}\n`);
        registraExcecao(err.stack, data['empresa']);
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

    if (!data['empresa'] || !data['cdsenome'] || !data['cdsesenha'] || !data['cdseemail'] || !data['cdsecargoid']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDCARGOENUM.TABELA}" WHERE "${CDCARGOENUM.CDCARID}" = $1`,
            [data['cdsecargoid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        await db.query(montaInsert(CDSENHAENUM), Object.values(data).slice(0, -1));

        res.status(204).send();
    } catch (err) {
        console.error(`[Inserir usuário]: ${err.message}\n`);
        registraExcecao(err.stack, data['empresa']);
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

    if (!data['empresa'] || !data['cdseid']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDSENHAENUM.TABELA}" WHERE "${CDSENHAENUM.CDSEID}" = $1`,
            [data['cdseid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const colunas = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            if (key === 'cdseid' || key === 'empresa') continue;

            colunas.push(CDSENHAENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        colunas.push(CDSENHAENUM.CDSEID);
        parametros.push(data['cdseid']);

        await db.query(
            `UPDATE "${CDSENHAENUM.TABELA}" ` + montaUpdate(colunas),
            parametros
        );

        res.status(201).send();
    } catch (err) {
        console.error(`[Atualizar usuário]: ${err.message}\n`);
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
    const { empresa, cdseid } = req.body;

    if (!empresa || !cdseid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDSENHAENUM.TABELA}" WHERE "${CDSENHAENUM.CDSEID}" = $1`,
            [cdseid]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        await db.query(
            `DELETE FROM "${CDSENHAENUM.TABELA}" WHERE "${CDSENHAENUM.CDSEID}" = $1`,
            [cdseid]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar usuário]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;