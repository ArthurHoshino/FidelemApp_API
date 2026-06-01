import { Router } from "express";
import db from "../db/db.js";
import LCCARRINHOENUM from "../core/enums/lccarrinho.enum.js";
import CDPRODUTOENUM from "../core/enums/cdproduto.enum.js";
import CDSENHAENUM from "../core/enums/cdsenha.enum.js";
import { montaWhere, registraExcecao } from "../core/utils.js";

const router = Router();

async function produtoExiste(produtoId) {
    const { rows } = await db.query(
        `SELECT 1 FROM "${CDPRODUTOENUM.TABELA}" WHERE "${CDPRODUTOENUM.CDPRODID}" = $1`,
        [produtoId]
    );
    return rows.length > 0;
}

async function usuarioExiste(usuarioId) {
    const { rows } = await db.query(
        `SELECT 1 FROM "${CDSENHAENUM.TABELA}" WHERE "${CDSENHAENUM.CDSEID}" = $1`,
        [usuarioId]
    );
    return rows.length > 0;
}

async function validarFk(produtoId, usuarioId) {
    const [prodOk, userOk] = await Promise.all([
        produtoExiste(produtoId),
        usuarioExiste(usuarioId),
    ]);

    if (!prodOk && !userOk) {
        return { error: 'Produto e usuário não encontrados', status: 409 };
    }
    if (!prodOk) {
        return { error: 'Produto não encontrado', status: 409 };
    }
    if (!userOk) {
        return { error: 'Usuário não encontrado', status: 409 };
    }
    return null;
}

async function buscarPorPar(produtoId, usuarioId) {
    const { rows } = await db.query(
        `SELECT * FROM "${LCCARRINHOENUM.TABELA}"
         WHERE "${LCCARRINHOENUM.LCCARPRODUTOID}" = $1 AND "${LCCARRINHOENUM.LCCARUSUARIOID}" = $2`,
        [produtoId, usuarioId]
    );
    return rows[0] ?? null;
}

async function buscarPorId(id) {
    const { rows } = await db.query(
        `SELECT * FROM "${LCCARRINHOENUM.TABELA}" WHERE "${LCCARRINHOENUM.LCCARID}" = $1`,
        [id]
    );
    return rows[0] ?? null;
}

async function removerPorId(id) {
    await db.query(
        `DELETE FROM "${LCCARRINHOENUM.TABELA}" WHERE "${LCCARRINHOENUM.LCCARID}" = $1`,
        [id]
    );
}

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    if (!data['lccarusuarioid']) {
        return res.status(400).json({ error: 'Usuário não informado' });
    }

    try {
        const colunas = [LCCARRINHOENUM.LCCARUSUARIOID];
        const parametros = [data['lccarusuarioid']];

        for (const [key, value] of Object.entries(data)) {
            if (key === 'lccarusuarioid') continue;
            if (LCCARRINHOENUM[key.toUpperCase()] === undefined) continue;

            colunas.push(LCCARRINHOENUM[key.toUpperCase()]);
            parametros.push(value);
        }

        const select = `SELECT * FROM "${LCCARRINHOENUM.TABELA}" ` + montaWhere(colunas);
        const { rows } = await db.query(select, parametros);

        res.json(rows);
    } catch (err) {
        console.error(`[Buscar carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, data['lccarusuarioid']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null,
        });
    }
});

// <============================>
// Rotas POST
// <============================>
router.post('/', async (req, res) => {
    const data = req.body;

    if (!data['lccarprodutoid'] || !data['lccarusuarioid']) {
        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    }

    const produtoId = Number(data['lccarprodutoid']);
    const usuarioId = Number(data['lccarusuarioid']);
    const quantidade = data['lccarquantidade'] != null ? Number(data['lccarquantidade']) : 1;

    if (Number.isNaN(produtoId) || Number.isNaN(usuarioId) || Number.isNaN(quantidade)) {
        return res.status(400).json({ error: 'Valores numéricos inválidos' });
    }

    if (quantidade < 1) {
        return res.status(400).json({ error: 'Quantidade deve ser maior ou igual a 1' });
    }

    try {
        const fkErro = await validarFk(produtoId, usuarioId);
        if (fkErro) {
            return res.status(fkErro.status).json({ error: fkErro.error });
        }

        const existente = await buscarPorPar(produtoId, usuarioId);
        let item;

        if (existente) {
            const novaQuantidade = Number(existente[LCCARRINHOENUM.LCCARQUANTIDADE]) + quantidade;
            const { rows } = await db.query(
                `UPDATE "${LCCARRINHOENUM.TABELA}"
                 SET "${LCCARRINHOENUM.LCCARQUANTIDADE}" = $1
                 WHERE "${LCCARRINHOENUM.LCCARID}" = $2
                 RETURNING *`,
                [novaQuantidade, existente[LCCARRINHOENUM.LCCARID]]
            );
            item = rows[0];
        } else {
            const { rows } = await db.query(
                `INSERT INTO "${LCCARRINHOENUM.TABELA}"
                 ("${LCCARRINHOENUM.LCCARPRODUTOID}", "${LCCARRINHOENUM.LCCARUSUARIOID}", "${LCCARRINHOENUM.LCCARQUANTIDADE}")
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [produtoId, usuarioId, quantidade]
            );
            item = rows[0];
        }

        res.status(201).json(item);
    } catch (err) {
        console.error(`[Adicionar ao carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, data['lccarusuarioid']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null,
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
        if (data['lccarid'] != null) {
            if (data['lccarquantidade'] == null) {
                return res.status(400).json({ error: 'Quantidade não informada' });
            }

            const id = Number(data['lccarid']);
            const quantidade = Number(data['lccarquantidade']);

            if (Number.isNaN(id) || Number.isNaN(quantidade)) {
                return res.status(400).json({ error: 'Valores numéricos inválidos' });
            }

            const item = await buscarPorId(id);
            if (!item) {
                return res.status(404).json({ error: 'Item do carrinho não encontrado' });
            }

            if (quantidade < 1) {
                await removerPorId(id);
                return res.status(204).send();
            }

            await db.query(
                `UPDATE "${LCCARRINHOENUM.TABELA}"
                 SET "${LCCARRINHOENUM.LCCARQUANTIDADE}" = $1
                 WHERE "${LCCARRINHOENUM.LCCARID}" = $2`,
                [quantidade, id]
            );

            return res.status(204).send();
        }

        if (data['lccarprodutoid'] != null && data['lccarusuarioid'] != null && data['lccarquantidade'] != null) {
            const produtoId = Number(data['lccarprodutoid']);
            const usuarioId = Number(data['lccarusuarioid']);
            const delta = Number(data['lccarquantidade']);

            if (Number.isNaN(produtoId) || Number.isNaN(usuarioId) || Number.isNaN(delta)) {
                return res.status(400).json({ error: 'Valores numéricos inválidos' });
            }

            const item = await buscarPorPar(produtoId, usuarioId);
            if (!item) {
                return res.status(404).json({ error: 'Item do carrinho não encontrado' });
            }

            const novaQuantidade = Number(item[LCCARRINHOENUM.LCCARQUANTIDADE]) + delta;

            if (novaQuantidade <= 0) {
                await removerPorId(item[LCCARRINHOENUM.LCCARID]);
                return res.status(204).send();
            }

            await db.query(
                `UPDATE "${LCCARRINHOENUM.TABELA}"
                 SET "${LCCARRINHOENUM.LCCARQUANTIDADE}" = $1
                 WHERE "${LCCARRINHOENUM.LCCARID}" = $2`,
                [novaQuantidade, item[LCCARRINHOENUM.LCCARID]]
            );

            return res.status(204).send();
        }

        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    } catch (err) {
        console.error(`[Atualizar carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, data['lccarusuarioid'] ?? data['lccarid']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null,
        });
    }
});

// <============================>
// Rotas DELETE
// <============================>
router.delete('/', async (req, res) => {
    const data = req.body;

    try {
        if (data['lccarid'] != null) {
            const id = Number(data['lccarid']);

            if (Number.isNaN(id)) {
                return res.status(400).json({ error: 'Identificador inválido' });
            }

            const item = await buscarPorId(id);
            if (!item) {
                return res.status(404).json({ error: 'Item do carrinho não encontrado' });
            }

            await removerPorId(id);
            return res.status(204).send();
        }

        if (data['lccarprodutoid'] != null && data['lccarusuarioid'] != null) {
            const produtoId = Number(data['lccarprodutoid']);
            const usuarioId = Number(data['lccarusuarioid']);

            if (Number.isNaN(produtoId) || Number.isNaN(usuarioId)) {
                return res.status(400).json({ error: 'Valores numéricos inválidos' });
            }

            const item = await buscarPorPar(produtoId, usuarioId);
            if (!item) {
                return res.status(404).json({ error: 'Item do carrinho não encontrado' });
            }

            await removerPorId(item[LCCARRINHOENUM.LCCARID]);
            return res.status(204).send();
        }

        return res.status(400).json({ error: 'Dados obrigatórios faltantes' });
    } catch (err) {
        console.error(`[Remover do carrinho]: ${err.message}\n`);
        registraExcecao(err.stack, data['lccarusuarioid'] ?? data['lccarid']);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null,
        });
    }
});

export default router;
