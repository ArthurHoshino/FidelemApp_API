/**
 * Enum com os códigos das ações de auditoria
 * Chave: Descrição da ação
 * Valor: Código da ação no banco de dados
 */
const ACAOCOD = {
    'Buscar empresas': 1,
    'Adicionar empresa': 2,
    'Atualizar empresa': 3,
    'Deletar empresa': 4,
    'Buscar cargos': 5,
    'Adicionar cargo': 6,
    'Atualizar cargo': 7,
    'Deletar cargo': 8,
    'Buscar usuários': 9,
    'Adicionar usuário': 10,
    'Atualizar usuário': 11,
    'Deletar usuário': 12,
    'Buscar produtos': 13,
    'Buscar produto individual': 14,
    'Adicionar produto': 15,
    'Atualizar produto': 16,
    'Deletar produto': 17,
    'Buscar imagens de produto': 18,
    'Adicionar imagem de produto': 19,
    'Atualizar imagem de produto': 20,
    'Deletar imagem de produto': 21,
    'Buscar vendas': 22,
    'Adicionar venda': 23,
    'Atualizar venda': 24,
    'Deletar venda': 25,
    'Buscar últimas consultas': 26,
};

Object.freeze(ACAOCOD);

export default ACAOCOD;

