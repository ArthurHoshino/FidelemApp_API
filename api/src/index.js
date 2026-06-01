import express from 'express';

// Rotas
import cdEmpresaRoutes from './routes/cdempresa.routes.js';
import cdCargoRoutes from './routes/cdcargo.routes.js';
import cdSenhaRoutes from './routes/cdsenha.routes.js';
import lcAuditoriaRoutes from './routes/lcauditoria.routes.js';
import cdExcecaoRoutes from './routes/cdexcecao.routes.js';
import cdProdutoRoutes from './routes/cdproduto.routes.js';
import cdProdutoImagem from './routes/cdprodutoimagem.routes.js';
import cdCategoriaRoutes from './routes/cdcategoria.routes.js';
import lcCarrinhoRoutes from './routes/lccarrinho.routes.js';
import geminiRoutes from './routes/gemini.routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'API FidelemApp rodando!' });
});

// Indicar para o express utilizar as nossas rotas
app.use('/cdempresa', cdEmpresaRoutes);
app.use('/cdcargo', cdCargoRoutes);
app.use('/cdsenha', cdSenhaRoutes);
app.use('/lcauditoria', lcAuditoriaRoutes);
app.use('/cdexcecao', cdExcecaoRoutes);
app.use('/cdproduto', cdProdutoRoutes);
app.use('/cdprodutoimagem', cdProdutoImagem);
app.use('/cdcategoria', cdCategoriaRoutes);
app.use('/lccarrinho', lcCarrinhoRoutes);
app.use('/ia-service', geminiRoutes);

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}\n`);
});
