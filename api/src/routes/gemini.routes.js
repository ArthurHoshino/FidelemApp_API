import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import db from "../db/db.js";

const router = Router();

// Inicializa a IA com a sua chave
const genAI = new GoogleGenerativeAI(process.env.FIDELEM_GEMINI_API_KEY);

router.post('/chat-receitas', async (req, res) => {
    try {
        // Recebe a nova pergunta, o histórico e os IDs de identificação do carrinho
        const { mensagemUsuario, historico = [], lcvensenhaid, lccarempresaid, itensCarrinho } = req.body;

        if (!mensagemUsuario) {
            return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
        }

        let systemInstructionText = "Você é um Chef virtual de supermercado. Responda de forma curta, amigável, acolhedora e sempre focada em culinária e aproveitamento de alimentos.";
        let listStr = "";

        // Tentar recuperar itens de carrinho informados diretamente no body
        if (itensCarrinho && Array.isArray(itensCarrinho) && itensCarrinho.length > 0) {
            listStr = itensCarrinho.map(item => `${item.quantidade}x ${item.nome}`).join(', ');
        }
        // Se não houver, tentar buscar no banco de dados se os IDs foram fornecidos
        else if (lcvensenhaid && lccarempresaid) {
            const cartQuery = `
                SELECT c.*, p."CDPRODNOME" 
                FROM "LCCARRINHO" c
                JOIN "CDPRODUTO" p ON p."CDPRODID" = c."LCCARPRODUTOID"
                WHERE c."LCCARSENHAID" = $1 AND c."LCCAREMPRESAID" = $2
            `;
            const cartResult = await db.query(cartQuery, [lcvensenhaid, lccarempresaid]);
            if (cartResult.rows.length > 0) {
                listStr = cartResult.rows.map(row => `${row.LCCARQUANTIDADE}x ${row.CDPRODNOME}`).join(', ');
            }
        }

        if (listStr) {
            systemInstructionText = `Você é um Chef virtual de supermercado. O usuário possui os seguintes itens no carrinho de compras: ${listStr}. Responda de forma curta, prestativa e amigável, sugerindo receitas criativas e práticas focadas no aproveitamento desses ingredientes do carrinho de compras, mas também respondendo a outras dúvidas culinárias se o usuário pedir.`;
        } else {
            systemInstructionText = `Você é um Chef virtual de supermercado. O usuário está com o carrinho vazio. Responda de forma curta, prestativa e amigável. Avise-o que ele pode colocar produtos no carrinho para receber sugestões de receitas personalizadas baseadas nos ingredientes dele, mas de qualquer forma ofereça receitas genéricas e boas baseadas no que ele digitar.`;
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: systemInstructionText
        });

        // Inicializa o chat injetando a memória passada pelo Flutter
        const chat = model.startChat({
            history: historico,
            generationConfig: {
                temperature: 0.7, // Criatividade equilibrada
            },
        });

        // Envia a nova mensagem considerando tudo o que foi dito antes
        const result = await chat.sendMessage(mensagemUsuario);
        const respostaIA = result.response.text();

        return res.status(200).json({ 
            sucesso: true, 
            resposta: respostaIA 
        });

    } catch (error) {
        console.error('Erro no Chat:', error);
        return res.status(500).json({ error: 'Não foi possível processar a mensagem agora.' });
    }
});

export default router;