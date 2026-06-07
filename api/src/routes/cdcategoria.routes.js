import { Router } from "express";
import db from "../db/db.js";
import CDCATEGORIAENUM from "../core/enums/cdcategoria.enum.js";
import { montaInsert, montaUpdate, montaWhere, registraExcecao, registraAuditoria } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    // Passar o cargo no formato: http://localhost:3000/cdcategoria?cdcatnome=?
    const data = req.query;

    try {
        let { rows } = await db.query(
            `SELECT 1 FROM "${CDCATEGORIAENUM.TABELA}"`,
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Nenhuma categoria cadastrada' });
        }

        const colunas    = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            colunas.push(CDCATEGORIAENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        const select = `SELECT "${CDCATEGORIAENUM.TABELA}".* FROM "${CDCATEGORIAENUM.TABELA}" ` + montaWhere(colunas);
        ({ rows } = await db.query(select, parametros))

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar categorias]: ${err.message}\n`);
        registraExcecao(err.stack, 0);
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

    if (!data['cdcatnome'] || !data['cdcatempresaid']) {
        return res.status(400).json({ error: 'Existem dados obrigatórios faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDCATEGORIAENUM.TABELA}" WHERE "${CDCATEGORIAENUM.CDCATNOME}" = $1`,
            [data['cdcatnome']]
        );

        if (rows.length > 0) {
            return res.status(400).json({ error: 'Categoria já está cadastrada' });
        }

        await db.query(montaInsert(CDCATEGORIAENUM), Object.values(data));

        await registraAuditoria(
            `Nova categoria cadastrada: ${data['cdcatnome']}`,
            11, // CADASTRO_CATEGORIA
            data['cdcatempresaid']
        );

        res.status(201).send();
    } catch (err) {
        console.error(`[Adicionar categoria]: ${err.message}\n`);
        registraExcecao(err.stack, 0);
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
            `SELECT 1 FROM "${CDCATEGORIAENUM.TABELA}" WHERE "${CDCATEGORIAENUM.CDCATEMPRESAID}" = $1 AND "${CDCATEGORIAENUM.CDCATID}" = $2`,
            [data['cdcatempresaid'], data['cdcatid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Categoria não encontrada' });
        }

        const colunas    = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            if (key === 'cdcatid') continue;

            colunas.push(CDCATEGORIAENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        colunas.push(CDCATEGORIAENUM.CDCATID);
        parametros.push(data['cdcatid']);

        await db.query(`UPDATE "${CDCATEGORIAENUM.TABELA}" ` + montaUpdate(colunas), parametros);

        await registraAuditoria(
            `Categoria atualizada (ID: ${data['cdcatid']})`,
            12, // EDICAO_CATEGORIA
            data['cdcatempresaid']
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar categoria]: ${err.message}\n`);
        registraExcecao(err.stack, 0);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas DELETE
// // <============================>
router.delete('/', async (req, res) => {
    const data = req.body;

    if (!data['cdcatid'] || !data['cdcatempresaid']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDCATEGORIAENUM.TABELA}" WHERE "${CDCATEGORIAENUM.CDCATEMPRESAID}" = $1 AND "${CDCATEGORIAENUM.CDCATID}" = $2`,
            [data['cdcatempresaid'], data['cdcatid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }

        await db.query(`DELETE FROM "${CDCATEGORIAENUM.TABELA}" WHERE "${CDCATEGORIAENUM.CDCATID}" = $1 AND "${CDCATEGORIAENUM.CDCATEMPRESAID}" = $2`, Object.values(data));

        await registraAuditoria(
            `Categoria removida (ID: ${data['cdcatid']})`,
            13, // REMOCAO_CATEGORIA
            data['cdcatempresaid']
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar categoria]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdcatempresaid']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
})

export default router;
