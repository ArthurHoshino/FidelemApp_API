import { Router } from "express";
import db from '../db/db.js';
import CDCARGOENUM from "../core/enums/cdcargo.enum.js";
import CDEMPRESAENUM from '../core/enums/cdempresa.enum.js';
import CDSENHAENUM from '../core/enums/cdsenha.enum.js';
import ACAOCOD from '../core/enums/acaoCod.enum.js';
import { montaInsert, montaUpdate, montaWhere, registraExcecao, registraAuditoria } from '../core/utils.js';

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

        for (const [key, value] of Object.entries(data)) {
            if (key === 'empresa') continue;

            colunasCondicoes.push(CDSENHAENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        const select = `SELECT "CDSENHA".* FROM "CDSENHA"
            JOIN "CDCARGO" ON "CDCARID" = "CDSECARGOID"
            JOIN "CDEMPRESA" ON "CDEMPID" = "CDCAREMPRESAID" ` + montaWhere(colunasCondicoes);

        const { rows } = await db.query(select, parametros);

        // Registrar auditoria
        const acaoId = ACAOCOD['Buscar usuários'];
        if (acaoId && data['empresa']) {
            await registraAuditoria(
                `Busca de usuários realizada para empresa ${data['empresa']}`,
                acaoId,
                data['empresa'],
                data['cdseid'] || null
            );
        }

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

        // Registrar auditoria
        const acaoId = ACAOCOD['Adicionar usuário'];
        if (acaoId && data['empresa']) {
            await registraAuditoria(
                `Usuário "${data['cdsenome']}" adicionado`,
                acaoId,
                data['empresa'],
                null
            );
        }

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

        const colunas    = [];
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

        // Registrar auditoria
        const acaoId = ACAOCOD['Atualizar usuário'];
        if (acaoId && data['empresa']) {
            await registraAuditoria(
                `Usuário ID ${data['cdseid']} atualizado`,
                acaoId,
                data['empresa'],
                data['cdseid'] || null
            );
        }

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

        // Registrar auditoria
        const acaoId = ACAOCOD['Deletar usuário'];
        if (acaoId && empresa) {
            await registraAuditoria(
                `Usuário ID ${cdseid} deletado`,
                acaoId,
                empresa,
                null
            );
        }

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