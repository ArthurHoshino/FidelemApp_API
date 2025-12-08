import { Router } from "express";
import { registraAuditoria } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas POST
// <============================>
router.post('/', async (req, res) => {
    const { lcauddescricao, lcaudacaoid, lcaudempresaid } = req.body;

    if (lcauddescricao || lcaudacaoid || lcaudempresaid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await registraAuditoria(lcauddescricao, lcaudacaoid, lcaudempresaid);

        res.status(201).send();
    } catch (err) {
        console.error(`[Inserir auditoria]: ${err.message}\n`);
        registraExcecao(err.stack, lcaudempresaid);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;