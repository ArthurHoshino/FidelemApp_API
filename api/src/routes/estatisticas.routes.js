import { Router } from "express";
import db from '../db/db.js';
import { registraExcecao } from '../core/utils.js';

const router = Router();

// <============================>
// Rotas GET
// <============================>
router.get('/', async (req, res) => {
    const { empresaid, dias = 30 } = req.query;

    if (!empresaid) {
        return res.status(400).json({ error: 'Empresa não informada' });
    }

    const intervalo = `${parseInt(dias)} days`;

    try {
        // KPIs
        const { rows: [kpiVendas] } = await db.query(
            `SELECT COUNT(*) as "totalVendas"
             FROM "LCVENDA"
             JOIN "CDSENHA" ON "CDSEID" = "LCVENSENHAID"
             JOIN "CDCARGO" ON "CDCARID" = "CDSECARGOID"
             WHERE "CDCAREMPRESAID" = $1 AND "LCVENDATA" >= NOW() - INTERVAL '${intervalo}'`,
            [empresaid]
        );

        const { rows: [kpiClientes] } = await db.query(
            `SELECT COUNT(DISTINCT "LCVENSENHAID") as "totalClientes"
             FROM "LCVENDA"
             JOIN "CDSENHA" ON "CDSEID" = "LCVENSENHAID"
             JOIN "CDCARGO" ON "CDCARID" = "CDSECARGOID"
             WHERE "CDCAREMPRESAID" = $1 AND "LCVENDATA" >= NOW() - INTERVAL '${intervalo}'`,
            [empresaid]
        );

        const { rows: [kpiPontos] } = await db.query(
            `SELECT COALESCE(SUM(
                CASE WHEN "LCAUDDESCRICAO" ~ 'Total: R\\$ [0-9.]+' AND NOT ("LCAUDDESCRICAO" ~ 'Método: pontos')
                     THEN CAST(FLOOR(CAST(SUBSTRING("LCAUDDESCRICAO" FROM 'Total: R\\$ ([0-9.]+)') AS NUMERIC)) AS INTEGER)
                     ELSE 0
                END
             ), 0) as "pontosDistribuidos"
             FROM "LCAUDITORIA"
             WHERE "LCAUDEMPRESAID" = $1 AND "LCAUDACAOID" = 6 AND "LCAUDDATA" >= NOW() - INTERVAL '${intervalo}'`,
            [empresaid]
        );

        const { rows: [kpiOperacoes] } = await db.query(
            `SELECT COUNT(*) as "totalOperacoes"
             FROM "LCAUDITORIA"
             WHERE "LCAUDEMPRESAID" = $1 AND "LCAUDDATA" >= NOW() - INTERVAL '${intervalo}'`,
            [empresaid]
        );

        const kpis = {
            totalVendas: parseInt(kpiVendas.totalVendas),
            totalClientes: parseInt(kpiClientes.totalClientes),
            pontosDistribuidos: parseInt(kpiPontos.pontosDistribuidos),
            totalOperacoes: parseInt(kpiOperacoes.totalOperacoes),
        };

        // Vendas por Dia
        const { rows: vendasPorDia } = await db.query(
            `SELECT DATE("LCVENDATA") as data, COUNT(*) as total
             FROM "LCVENDA"
             JOIN "CDSENHA" ON "CDSEID" = "LCVENSENHAID"
             JOIN "CDCARGO" ON "CDCARID" = "CDSECARGOID"
             WHERE "CDCAREMPRESAID" = $1 AND "LCVENDATA" >= NOW() - INTERVAL '${intervalo}'
             GROUP BY DATE("LCVENDATA")
             ORDER BY data ASC`,
            [empresaid]
        );

        // Horários de Pico
        const { rows: horariosPico } = await db.query(
            `SELECT EXTRACT(HOUR FROM "LCAUDDATA") as hora, COUNT(*) as total
             FROM "LCAUDITORIA"
             WHERE "LCAUDEMPRESAID" = $1 AND "LCAUDDATA" >= NOW() - INTERVAL '${intervalo}'
             GROUP BY hora
             ORDER BY hora ASC`,
            [empresaid]
        );

        // Volume de Ações
        const { rows: volumeAcoes } = await db.query(
            `SELECT "LCAUDACAOID" as "acaoId", "CDACAODESCRICAO" as descricao, COUNT(*) as total
             FROM "LCAUDITORIA"
             JOIN "CDACAO" ON "CDACAOID" = "LCAUDACAOID"
             WHERE "LCAUDEMPRESAID" = $1 AND "LCAUDDATA" >= NOW() - INTERVAL '${intervalo}'
             GROUP BY "LCAUDACAOID", "CDACAODESCRICAO"
             ORDER BY total DESC`,
            [empresaid]
        );

        // Novos Cadastros
        const { rows: novosCadastros } = await db.query(
            `SELECT DATE("LCAUDDATA") as data, COUNT(*) as total
             FROM "LCAUDITORIA"
             WHERE "LCAUDEMPRESAID" = $1 AND "LCAUDACAOID" = 14 AND "LCAUDDATA" >= NOW() - INTERVAL '${intervalo}'
             GROUP BY DATE("LCAUDDATA")
             ORDER BY data ASC`,
            [empresaid]
        );

        // Pontos Resumo
        const { rows: pontosRows } = await db.query(
            `SELECT "LCAUDACAOID" as tipo, COALESCE(SUM(
                CASE 
                    -- Pontos Acumulados (tipo 6): vendas não realizadas pelo método de pagamento de ponto
                    WHEN "LCAUDACAOID" = 6 AND "LCAUDDESCRICAO" ~ 'Total: R\\$ [0-9.]+' AND NOT ("LCAUDDESCRICAO" ~ 'Método: pontos') THEN
                        CAST(FLOOR(CAST(SUBSTRING("LCAUDDESCRICAO" FROM 'Total: R\\$ ([0-9.]+)') AS NUMERIC)) AS INTEGER)
                    -- Pontos Resgatados (tipo 5): valor da compra quando o método de pagamento for por pontos
                    WHEN "LCAUDACAOID" = 5 AND "LCAUDDESCRICAO" ~ 'Método: pontos' AND "LCAUDDESCRICAO" ~ 'Pontos: \\d+' THEN
                        CAST(SUBSTRING("LCAUDDESCRICAO" FROM 'Pontos: (\\d+)') AS INTEGER)
                    ELSE 0
                END
             ), 0) as total
              FROM "LCAUDITORIA"
              WHERE "LCAUDEMPRESAID" = $1 AND "LCAUDACAOID" IN (5, 6) AND "LCAUDDATA" >= NOW() - INTERVAL '${intervalo}'
              GROUP BY "LCAUDACAOID"`,
            [empresaid]
        );

        const pontosResumo = {
            acumulados: 0,
            resgatados: 0,
        };

        for (const row of pontosRows) {
            if (parseInt(row.tipo) === 6) pontosResumo.acumulados = parseInt(row.total);
            if (parseInt(row.tipo) === 5) pontosResumo.resgatados = parseInt(row.total);
        }

        // Caixa por Categoria
        const { rows: caixaPorCategoriaRows } = await db.query(
            `SELECT 
                "CDCATNOME" as categoria,
                SUM(CAST(item->>'quantidade' AS INTEGER) * "CDPRODPRECOREAL") as total
             FROM "LCVENDA"
             CROSS JOIN jsonb_array_elements("LCVENPRODUTOS"::jsonb) as item
             JOIN "CDPRODUTO" ON "CDPRODID" = CAST(item->>'cdprodid' AS INTEGER)
             JOIN "CDCATEGORIA" ON "CDCATID" = "CDPRODCATEGORIAID"
             JOIN "CDSENHA" ON "CDSEID" = "LCVENSENHAID"
             JOIN "CDCARGO" ON "CDCARID" = "CDSECARGOID"
             WHERE "CDCAREMPRESAID" = $1 AND "LCVENDATA" >= NOW() - INTERVAL '${intervalo}'
             GROUP BY "CDCATNOME"
             ORDER BY total DESC`,
            [empresaid]
        );

        const caixaPorCategoria = caixaPorCategoriaRows.map(row => ({
            categoria: row.categoria,
            total: parseFloat(row.total)
        }));

        res.json({
            kpis,
            vendasPorDia,
            horariosPico,
            volumeAcoes,
            novosCadastros,
            pontosResumo,
            caixaPorCategoria,
        });
    } catch (err) {
        console.error(`[Estatísticas]: ${err.message}\n`);
        registraExcecao(err.stack, empresaid);
        res.status(500).json({
            error: err.message,
            detalhes: err.cause ? err.cause : null
        });
    }
});

export default router;