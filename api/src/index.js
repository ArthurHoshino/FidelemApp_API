import express from 'express';

// Rotas
import cdEmpresaRoutes from './routes/cdempresa.routes.js';
import cdCargoRoutes from './routes/cdcargo.routes.js';
import cdSenhaRoutes from './routes/cdsenha.routes.js';

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

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}\n`);
});
