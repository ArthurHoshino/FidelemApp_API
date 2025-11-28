import db from '../db/db.js';
import { DateTime } from 'luxon';

// Enums
import LCAUDITORIAENUM from '../core/enums/lcauditoria.enum.js';
import CDEXCECAOENUM from '../core/enums/cdexcecao.enum.js';

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


/**
 * Função para montar condições das queries
 * 
 * @param {Array<String>} colunas As colunas que serão inseridas na query
 * @return A string da query
 */
export function montaWhere(colunas) {
    let condicoes = '';
    let parametrosContagem = 1;

    colunas.forEach((coluna) => {
        if (condicoes === '') {
            condicoes = `WHERE "${colunas[0]}" = $1`;
        } else {
            condicoes += ` AND "${coluna}" = $${parametrosContagem}`;
        }
        parametrosContagem++;
    });

    return condicoes;
}

/**
 * Função para montar o insert das queries
 * 
 * @param {Object} tabelaEnum O objeto enum para construção do comando Insert
 * @param {boolean} retornaValores Indica se o registro inserido será retornado
 * @return A string da query
 */
export function montaInsert(tabelaEnum, retornaValores = false) {
    let colunas = '';
    let valores = '';
    let parametrosContagem = 1;
    const campos = Object.entries(tabelaEnum).slice(2);

    for (const [key, value] of campos) {
        if (colunas === '' && valores === '') {
            colunas = `("${value}"`;
            valores = `($${parametrosContagem}`;
        } else {
            colunas += `, "${value}"`;
            valores += `, $${parametrosContagem}`;
        }
        parametrosContagem++;
    }

    colunas += ")";
    valores += ")";

    return `INSERT INTO "${tabelaEnum.TABELA}" ${colunas} VALUES ${valores}` + (retornaValores ? " RETURNING *;" : "");
}

/**
 * Função para montar o insert das queries
 * 
 * @param {Array<String>} colunas O objeto enum para construção do comando Update
 * @param {boolean} retornaValores Indica se o registro inserido será retornado
 * @return A string da query
 */
export function montaUpdate(colunas, retornaValores = false) {
    let campos = '';
    let parametrosContagem = 1;

    colunas.slice(0, -1).forEach((valor) => {
        if (campos === '') {
            campos += `"${valor}" = $${parametrosContagem}`;
        } else {
            campos += `, "${valor}" = $${parametrosContagem}`;
        }
        parametrosContagem++;
    });

    return `SET ${campos} WHERE "${colunas.slice(-1)}" = $${parametrosContagem}` + (retornaValores ? " RETURNING *;" : "");
}

// <=========================================>
// Funções de auditoria e registro de exceção
// <=========================================>

/**
 * Função para registrar uma ação na LCAUDITORIA
 * 
 * @param {String} descricao Detalhamento da ação
 * @param {Integer} acao Código da ação
 * @param {Integer} empresa Código da empresa
 * @return {boolean} Booleano indicando se a inserção deu certo ou não
 */
export async function registraAuditoria(descricao, acao, empresa) {
    try {
        const tempo = DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd HH:mm:ss');
        console.log(`Tempo: ${tempo}`);

        await db.query(
            `INSERT INTO "${LCAUDITORIAENUM.TABELA}" ("${LCAUDITORIAENUM.LCAUDDESCRICAO}", "${LCAUDITORIAENUM.LCAUDDATA}", "${LCAUDITORIAENUM.LCAUDACAOID}", "${LCAUDITORIAENUM.LCAUDEMPRESAID}")
            VALUES ($1, $2, $3, $4)`,
            [descricao, tempo, acao, empresa]
        );

        return true;
    } catch (err) {
        console.error(`[Inserir auditoria]: ${err.message}\n${err.stack}\n`);
        await registraExcecao(err.stack, empresa);
        return false;
    }
}

/**
 * Função para registrar uma exceção na CDEXCECAO
 * 
 * @param {String} descricao Detalhamento da exceção
 * @param {Integer} empresa Código da empresa
 * @return Void
 */
export async function registraExcecao(descricao, empresa) {
    try {
        const tempo = DateTime.now().setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd HH:mm:ss');
        console.log(`Tempo: ${tempo}`);

        await db.query(
            `INSERT INTO "${CDEXCECAOENUM.TABELA}" ("${CDEXCECAOENUM.CDEXDESCRICAO}", "${CDEXCECAOENUM.CDEXDATA}", "${CDEXCECAOENUM.CDEXEMPRESAID}")
            VALUES ($1, $2, $3)`,
            [descricao, tempo, empresa]
        );
    } catch (err) {
        console.error(`[Inserir excecao]: ${err.message}\n${err.stack}\n`);
    }
}