import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
    console.log('PostgreSQL conectado via pool.\n');
});

// Exporta as funções de query e client para transação
export default {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};