import { Router } from "express";
import multer from "multer";
import db from "../db/db.js";
import { registraExcecao } from '../core/utils.js';

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
router.get('/', async (req, res) => {
    const { cdprodimgprodutoid } = req.query;
    if (!cdprodimgprodutoid) {
        return res.status(418).send();
    }

    try {
        const { rows } = await db.query(
            `SELECT "${CDPRODUTOIMAGEMENUM.CDPRODIMGID}", "${CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB}", "${CDPRODUTOIMAGEMENUM.CDPRODIMGORDEM}"
             FROM "${CDPRODUTOIMAGEMENUM.TABELA}"
             WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $1
             ORDER BY "${CDPRODUTOIMAGEMENUM.CDPRODIMGORDEM}" ASC, "${CDPRODUTOIMAGEMENUM.CDPRODIMGID}" ASC`,
            [cdprodimgprodutoid]
        );

        rows.forEach(row => {
            if (row[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB]) {
                row[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB] = row[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB].toString('base64');
            }
        });

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar imagens]: ${err.message}\n`);
        res.status(500).json({ error: err.message });
    }
});

// <============================>
// Rotas POST
// <============================>
router.post('/', produtoImagem.single('prodimagem'), async (req, res) => {
    const { empresa, cdprodimgprodutoid, cdprodimgordem } = req.body;

    if (!cdprodimgprodutoid || !req.file) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    try {
        let order = parseInt(cdprodimgordem, 10);
        if (isNaN(order)) {
            const maxOrderResult = await db.query(
                `SELECT COALESCE(MAX("${CDPRODUTOIMAGEMENUM.CDPRODIMGORDEM}"), 0) as max_order FROM "${CDPRODUTOIMAGEMENUM.TABELA}" WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $1`,
                [cdprodimgprodutoid]
            );
            order = (maxOrderResult.rows[0].max_order || 0) + 1;
        }

        const insertResult = await db.query(
            `INSERT INTO "${CDPRODUTOIMAGEMENUM.TABELA}" ("${CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB}", "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}", "${CDPRODUTOIMAGEMENUM.CDPRODIMGORDEM}")
            VALUES ($1, $2, $3) RETURNING "${CDPRODUTOIMAGEMENUM.CDPRODIMGID}"`,
            [req.file.buffer, cdprodimgprodutoid, order]
        );

        res.status(200).json({ id: insertResult.rows[0][CDPRODUTOIMAGEMENUM.CDPRODIMGID], order });
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
router.put('/reorder', async (req, res) => {
    const { empresa, cdprodimgprodutoid, imageIds } = req.body;

    if (!cdprodimgprodutoid || !Array.isArray(imageIds)) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes ou inválidos' });
    }

    try {
        for (let i = 0; i < imageIds.length; i++) {
            await db.query(
                `UPDATE "${CDPRODUTOIMAGEMENUM.TABELA}"
                 SET "${CDPRODUTOIMAGEMENUM.CDPRODIMGORDEM}" = $1
                 WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGID}" = $2 AND "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $3`,
                [i + 1, imageIds[i], cdprodimgprodutoid]
            );
        }
        res.status(204).send();
    } catch (err) {
        console.error(`[Reordenar imagens]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({ error: err.message });
    }
});

router.put('/', produtoImagem.single('prodimagem'), async (req, res) => {
    const { empresa, cdprodimgprodutoid, cdprodimgid } = req.body;

    if (!cdprodimgprodutoid && !cdprodimgid && !req.file) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    try {
        if (cdprodimgid) {
            await db.query(
                `UPDATE "${CDPRODUTOIMAGEMENUM.TABELA}"
                SET "${CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB}" = $1
                WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGID}" = $2`,
                [req.file.buffer, cdprodimgid]
            );
        } else {
            await db.query(
                `UPDATE "${CDPRODUTOIMAGEMENUM.TABELA}"
                SET "${CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB}" = $1
                WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $2`,
                [req.file.buffer, cdprodimgprodutoid]
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
    const { empresa, cdprodimgprodutoid, cdprodimgid } = req.body;

    if (!cdprodimgprodutoid && !cdprodimgid) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    try {
        if (cdprodimgid) {
            await db.query(
                `DELETE FROM "${CDPRODUTOIMAGEMENUM.TABELA}" WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGID}" = $1`,
                [cdprodimgid]
            );
        } else {
            await db.query(
                `DELETE FROM "${CDPRODUTOIMAGEMENUM.TABELA}" WHERE "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = $1`,
                [cdprodimgprodutoid]
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