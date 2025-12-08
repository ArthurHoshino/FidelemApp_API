import { Router } from "express";
import { montaWhere, montaInsert, montaUpdate, registraExcecao } from "../core/utils.js";
import CDPRODUTOENUM from '../core/enums/cdproduto.enum.js';
import CDEMPRESAENUM from "../core/enums/cdempresa.enum.js";
import CDPRODUTOIMAGEMENUM from "../core/enums/cdprodutoimagem.enum.js";
import db from "../db/db.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    if (!data['cdprodempresaid']) {
        return res.status(400).json({ error: 'Empresa não informada' });
    }

    try {
        const condicoes  = [CDPRODUTOENUM.CDPRODEMPRESAID];
        const parametros = [data[CDPRODUTOENUM.CDPRODEMPRESAID.toLowerCase()]];

        for (const [key, value] of Object.entries(data)) {
            if (key === CDPRODUTOENUM.CDPRODEMPRESAID.toLowerCase()) continue;

            condicoes.push(CDPRODUTOENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        const select = `SELECT "${CDPRODUTOENUM.TABELA}".*, "${CDPRODUTOIMAGEMENUM.TABELA}".* FROM "${CDPRODUTOENUM.TABELA}"
                        LEFT JOIN "${CDPRODUTOIMAGEMENUM.TABELA}" ON "${CDPRODUTOIMAGEMENUM.CDPRODIMGPRODUTOID}" = "${CDPRODUTOENUM.CDPRODID}"
                        JOIN "${CDEMPRESAENUM.TABELA}" ON "${CDEMPRESAENUM.CDEMPID}" = "${CDPRODUTOENUM.CDPRODEMPRESAID}" ` + montaWhere(condicoes);
        
        const { rows } = await db.query(select, parametros);

        rows.forEach(item => {
            // Transformar a imagem em string para base64 para enviar todas as informações em uma requisição só
            if (item[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB] !== null) {
                item[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB] = item[CDPRODUTOIMAGEMENUM.CDPRODIMGBLOB].toString('base64');
            }
        });

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar produtos]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdprodempresaid']);
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
    const data = JSON.parse(req.body);

    if (
        !data['cdprodnome'] ||
        (!data['cdprodprecoreal'] && !data['cdprodprecoponto']) ||
        !data['cdprodqtdestoque'] ||
        !data['cdprodempresaid'] ||
        !data['cdprodcategoriaid']
    ) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows} = await db.query(montaInsert(CDPRODUTOENUM, true), Object.values(data));

        res.status(204).send(rows);
    } catch (err) {
        console.error(`[Inserir produto]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdprodempresaid']);
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

    if (!data['cdprodempresaid'] || !data['cdprodid']) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        let { rows } = await db.query(
            `SELECT 1 FROM "${CDPRODUTOENUM.TABELA}" WHERE "${CDPRODUTOENUM.CDPRODID}" = $1`,
            [data['cdprodid']]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const colunas    = [];
        const parametros = [];

        for (const [key, value] of Object.entries(data)) {
            if (key === CDPRODUTOENUM.CDPRODEMPRESAID.toLowerCase()) continue;

            colunas.push(CDPRODUTOENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        colunas.push(CDPRODUTOENUM.CDPRODID);
        parametros.push(data['cdprodid']);

        ({ rows } = await db.query(
            `UPDATE "${CDPRODUTOENUM.TABELA}" ` + montaUpdate(colunas, true),
            parametros
        ));

        res.status(201).send(rows);
    } catch (err) {
        console.error(`[Atualizar produto]: ${err.message}\n`);
        registraExcecao(err.stack, data['cdprodempresaid']);
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
    const { empresa, cdprodid } = req.body;

    if (!empresa || !cdprodid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        const { rows } = await db.query(
            `SELECT 1 FROM "${CDPRODUTOENUM.TABELA}" WHERE "${CDPRODUTOENUM.CDPRODID}" = $1`,
            [cdprodid]
        );

        if (rows.length <= 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        await db.query(
            `DELETE FROM "${CDPRODUTOENUM.TABELA}" WHERE "${CDPRODUTOENUM.CDPRODID}" = $1`,
            [cdprodid]
        );

        res.status(204).send();
    } catch (err) {
        console.error(`[Deletar produto]: ${err.message}\n`);
        registraExcecao(err.stack, empresa);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    } 
});

export default router;