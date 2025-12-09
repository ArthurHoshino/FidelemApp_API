import { Router } from "express";
import multer from "multer";
import db from "../db/db.js";
import { registraExcecao, registraAuditoria, getCodigoAcao } from '../core/utils.js';

import CDPRODUTOIMAGEMENUM from "../core/enums/cdprodutoimagem.enum.js";

const router = Router();

const armazenamento = multer.memoryStorage();

const produtoImagem = multer({
    storage: armazenamento,
    limits: { fileSize: 5 * 1024 * 1024 } // Máximo 5MB
});

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => res.status(418).send());

// <============================>
// Rotas POST
// <============================>
router.post('/', produtoImagem.single('prodimagem'), async (req, res) => {
    const { empresa, cdprodimgprodutoid } = req.body;

    if (!cdprodimgprodutoid && !req.file) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDPRODUTOIMAGEMENUM.TABELA}" WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $1`,
            [cdprodimgprodutoid]
        );

        if (rows.length > 0) {
            return res.status(400).json({ error: 'Não é possível inserir mais de uma imagem para o mesmo produto' });
        }

        await db.query(
            `INSERT INTO "${CDPRODUTOIMAGEMENUM.TABELA}" ("${CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB}", "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}")
            VALUES ($1, $2)`,
            [req.file.buffer, cdprodimgprodutoid]
        );

        // Registrar auditoria
        const acaoId = await getCodigoAcao('Adicionar imagem de produto');
        if (acaoId && empresa) {
            await registraAuditoria(
                `Imagem adicionada para produto ID ${cdprodimgprodutoid}`,
                acaoId,
                empresa,
                null
            );
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Inserir imagem]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas PUT
// <============================>
router.put('/', produtoImagem.single('prodimagem'), async (req, res) => {
    const { empresa, cdprodimgprodutoid } = req.body;

    if (!cdprodimgprodutoid && !req.file) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await db.query(
            `UPDATE "${CDPRODUTOIMAGEMENUM.TABELA}"
            SET "${CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB}" = $1
            WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $2`,
            [req.file.buffer, cdprodimgprodutoid]
        );

        // Registrar auditoria
        const acaoId = await getCodigoAcao('Atualizar imagem de produto');
        if (acaoId && empresa) {
            await registraAuditoria(
                `Imagem atualizada para produto ID ${cdprodimgprodutoid}`,
                acaoId,
                empresa,
                null
            );
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar imagem]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
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
    const {empresa, cdprodimgprodutoid} = req.body;

    if (!cdprodimgprodutoid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await db.query(
            `DELETE FROM "${CDPRODUTOIMAGEMENUM.TABELA}" WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $1`,
            [cdprodimgprodutoid]
        );

        // Registrar auditoria
        const acaoId = await getCodigoAcao('Deletar imagem de produto');
        if (acaoId && empresa) {
            await registraAuditoria(
                `Imagem deletada para produto ID ${cdprodimgprodutoid}`,
                acaoId,
                empresa,
                null
            );
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar imagem]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;