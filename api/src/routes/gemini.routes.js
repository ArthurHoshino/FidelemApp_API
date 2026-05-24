import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Inicializa a IA com a sua chave
const genAI = new GoogleGenerativeAI(process.env.FIDELEM_GEMINI_API_KEY);

router.post('/chat-receitas', async (req, res) => {
    try {
        // Recebe a nova pergunta e o histórico salvo no celular do usuário
        const { mensagemUsuario, historico = [] } = req.body;

        if (!mensagemUsuario) {
            return res.status(400).json({ error: 'A mensagem não pode estar vazia.' });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: "Você é um Chef virtual de supermercado. Responda de forma curta, amigável e sempre focada em culinária e aproveitamento de alimentos."
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