import { Router } from "express";
import { montaWhere, montaInsert, montaUpdate, registraExcecao, registraAuditoria } from "../core/utils.js";
import LCVENDAENUM from '../core/enums/lcvenda.enum.js';
import CDSENHAENUM from "../core/enums/cdsenha.enum.js";
import ACAOCOD from "../core/enums/acaoCod.enum.js";
import db from "../db/db.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    if (!data['empresa'] || !data['lcvenid'] || !data['lcvensenhaid']) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    try {
        const parametros = [data['lcvenid'], data['lcvensenhaid']];

        const select = `SELECT "${LCVENDAENUM.TABELA}".* FROM "${LCVENDAENUM.TABELA}"
                        JOIN "${CDSENHAENUM.TABELA}" ON "${CDSENHAENUM.CDSEID}" = "${LCVENDAENUM.LCVENSENHAID}"
                        WHERE ${LCVENDAENUM.LCVENID} = $1 AND ${LCVENDAENUM.LCVENSENHAID} = $2`;
        
        const { rows } = await db.query(select, parametros);

        // Registrar auditoria
        const acaoId = ACAOCOD['Buscar vendas'];
        if (acaoId && data['empresa']) {
            await registraAuditoria(
                `Busca de vendas realizada`,
                acaoId,
                data['empresa'],
                data['lcvensenhaid'] || null
            );
        }

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar vendas]: ${err.message}\n`);
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

    if (!data['lcvensenhaid'] || !data['lcvenprodutos']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await db.query(montaInsert(LCVENDAENUM), Object.values(data));

        // Registrar auditoria
        const acaoId = ACAOCOD['Adicionar venda'];
        if (acaoId && data['empresa']) {
            await registraAuditoria(
                `Venda adicionada`,
                acaoId,
                data['empresa'],
                data['lcvensenhaid'] || null
            );
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Inserir venda]: ${err.message}\n`);
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

    if (!data['empresa'] || !data['lcvensenhaid'] || !data['lcvenprodutos']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${LCVENDAENUM.TABELA}" WHERE "${LCVENDAENUM.LCVENID}" = $1 AND "${LCVENDAENUM.LCVENSENHAID}" = $2`,
            [data['lcvenid'], data['lcvensenhaid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        await db.query(
            `UPDATE "${LCVENDAENUM.TABELA}" SET "${LCVENDAENUM.LCVENPRODUTOS}" = $1
            WHERE "${LCVENDAENUM.LCVENID}" = $2 AND "${LCVENDAENUM.LCVENSENHAID}" = $3`,
            [data['lcvenprodutos'], data['lcvenid'], data['lcvensenhaid']]
        );

        // Registrar auditoria
        const acaoId = ACAOCOD['Atualizar venda'];
        if (acaoId && data['empresa']) {
            await registraAuditoria(
                `Venda ID ${data['lcvenid']} atualizada`,
                acaoId,
                data['empresa'],
                data['lcvensenhaid'] || null
            );
        }

        res.status(201).send();
    } catch (err) {
        console.error(`[Atualizar venda]: ${err.message}\n`);
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
    const { empresa, lcvenid, lcvensenhaid } = req.body;

    if (!empresa || !lcvenid || !lcvensenhaid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${LCVENDAENUM.TABELA}" WHERE "${LCVENDAENUM.LCVENID}" = $1 AND "${LCVENDAENUM.LCVENSENHAID}" = $2`,
            [lcvenid, lcvensenhaid]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        await db.query(
            `DELETE FROM "${LCVENDAENUM.TABELA}" WHERE "${LCVENDAENUM.LCVENID}" = $1 AND "${LCVENDAENUM.LCVENSENHAID}" = $2`,
            [lcvenid, lcvensenhaid]
        );

        // Registrar auditoria
        const acaoId = ACAOCOD['Deletar venda'];
        if (acaoId && empresa) {
            await registraAuditoria(
                `Venda ID ${lcvenid} deletada`,
                acaoId,
                empresa,
                lcvensenhaid || null
            );
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar venda]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    } 
});

export default router;