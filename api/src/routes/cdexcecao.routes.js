import { Router } from "express";
import { registraExcecao } from "../core/utils.js";

const router = Router();

// <============================>
// Rotas POST
// <============================>
router.post('/', async (req, res) => {
    const { cdexdescricao, cdexempresaid } = req.body;

    if (!cdexdescricao, !cdexempresaid) {
        return res.status(400).json({ error: 'Dados obrigatório faltantes' });
    }

    try {
        await registraExcecao(cdexdescricao, cdexempresaid);

        res.status(201).send();
    } catch (err) {
        console.error(`[Registrar exceção]: ${err.message}\n`);
        registraExcecao(err.stack, cdexempresaid);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;