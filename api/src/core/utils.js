import db from '../db/db.js';

/**
 * Query para buscar todas as entidades de uma tabela ordenadas pela coluna id
 * 
 * @param {String} tabela A tabela que será feita a busca
 * @param {String} colunaId A coluna identificadora da tabela que será utilizada na ordenação
 * @return {Object} Registros do banco
 */
export async function getAllEntidades(tabela, colunaId) {
    try {
        const data = await db.query(`SELECT * FROM "${tabela}" ORDER BY "${colunaId}" ASC`);
        return data;
    } catch (err) {
        console.log(err.message);
        throw new Error(`Não foi possível buscar os registros de ${tabela}`, {cause: err.message});
    }
}

/**
 * Query para buscar uma entidade pelo id
 * 
 * @param {String} tabela A tabela que será feita a busca
 * @param {String} colunaId A coluna identificadora da tabela
 * @param {Integer} valorBusca O valor a ser buscado no banco
 * @return {Object} A entidade
 */
export async function getEntidadeById(tabela, colunaId, valorBusca) {
    try {
        const data = await db.query(
            `SELECT * FROM "${tabela}" WHERE "${colunaId}" = $1`,
            [valorBusca]
        );
        return data;
    } catch (err) {
        throw new Error(`Não foi possível buscar os registros de ${tabela}`, {cause: err.message});
    }
}

/**
 * Query para buscar uma empresa pelo nome ou descrição
 * 
 * @param {String} tabela A tabela que será feita a busca
 * @param {String} colunaNomeDesc A coluna nome ou descrição da tabela
 * @param {String} valorBusca O valor a ser buscado no banco
 * @return {Object} A entidade
 */
export async function getEntidadeByNomeDescricao(tabela, colunaNomeDesc, valorBusca) {
    try {
        const data = await db.query(
            `SELECT * FROM "${tabela}" WHERE "${colunaNomeDesc}" = $1`,
            [valorBusca]
        );
        return data;
    } catch (err) {
        throw new Error(`Não foi possível buscar os registros de ${tabela}`, {cause: err.message});
    }
}