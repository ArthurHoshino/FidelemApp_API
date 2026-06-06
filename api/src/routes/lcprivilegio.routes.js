import { Router } from "express";
import db from '../db/db.js';
import LCPRIVILEGIOENUM from "../core/enums/lcprivilegio.enum.js";
import CDCARGOENUM from "../core/enums/cdcargo.enum.js";
import { registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const data = req.query;

    if (!data['cdcarid']) {
        return res.status(400).json({ error: 'Cargo não informado' });
    }

    try {
        const { rows } = await db.query(
            `SELECT "${LCPRIVILEGIOENUM.CDPRIVID}" FROM "${LCPRIVILEGIOENUM.TABELA}" WHERE "${LCPRIVILEGIOENUM.CDCARID}" = $1`,
            [data['cdcarid']]
        );

        // Retornar apenas um array de IDs para facilitar no app
        const ids = rows.map(r => r[LCPRIVILEGIOENUM.CDPRIVID]);
        res.json(ids);
    } catch (err) {
        console.error(`[Buscar privilegios do cargo]: ${err.message}\n`);
        registraExcecao(err.stack, 0);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

// <============================>
// Rotas PUT (Atualizar todos)
// <============================>
router.put('/', async (req, res) => {
    const data = req.body;

    if (!data['cdcarid'] || !Array.isArray(data['privilegios'])) {
        return res.status(400).json({ error: 'Existem dados obrigatórios faltantes (cdcarid, privilegios[])' });
    }

    try {
        // Deleta todos os privilégios atuais do cargo
        await db.query(
            `DELETE FROM "${LCPRIVILEGIOENUM.TABELA}" WHERE "${LCPRIVILEGIOENUM.CDCARID}" = $1`,
            [data['cdcarid']]
        );

        // Insere os novos
        const privilegios = data['privilegios'];
        if (privilegios.length > 0) {
            // Monta o INSERT múltiplo: INSERT INTO tabela (cdcarid, cdprivid) VALUES ($1, $2), ($3, $4)...
            const valuesParams = [];
            const flatValues = [];
            let i = 1;

            for (const privId of privilegios) {
                valuesParams.push(`($${i}, $${i+1})`);
                flatValues.push(data['cdcarid'], privId);
                i += 2;
            }

            const insertQuery = `INSERT INTO "${LCPRIVILEGIOENUM.TABELA}" ("${LCPRIVILEGIOENUM.CDCARID}", "${LCPRIVILEGIOENUM.CDPRIVID}") VALUES ${valuesParams.join(', ')}`;
            await db.query(insertQuery, flatValues);
        }

        res.status(204).send();
    } catch (err) {
        console.error(`[Atualizar privilegios do cargo]: ${err.message}\n`);
        registraExcecao(err.stack, 0);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;
