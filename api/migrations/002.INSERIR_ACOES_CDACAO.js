/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // Adicionar campo LCAUDSENHAID na tabela LCAUDITORIA para identificar o usuário
  pgm.addColumn('LCAUDITORIA', {
    LCAUDSENHAID: {
      type: 'integer',
      notNull: false,
      references: '"CDSENHA"',
      onDelete: 'NO ACTION',
    },
  });

  // Criar índice para o novo campo
  pgm.createIndex('LCAUDITORIA', 'LCAUDSENHAID');

  // Inserir ações na CDACAO com códigos específicos
  // Códigos de ação baseados nas operações do sistema
  const acoes = [
    { codigo: 1, descricao: 'Buscar empresas' },
    { codigo: 2, descricao: 'Adicionar empresa' },
    { codigo: 3, descricao: 'Atualizar empresa' },
    { codigo: 4, descricao: 'Deletar empresa' },
    { codigo: 5, descricao: 'Buscar cargos' },
    { codigo: 6, descricao: 'Adicionar cargo' },
    { codigo: 7, descricao: 'Atualizar cargo' },
    { codigo: 8, descricao: 'Deletar cargo' },
    { codigo: 9, descricao: 'Buscar usuários' },
    { codigo: 10, descricao: 'Adicionar usuário' },
    { codigo: 11, descricao: 'Atualizar usuário' },
    { codigo: 12, descricao: 'Deletar usuário' },
    { codigo: 13, descricao: 'Buscar produtos' },
    { codigo: 14, descricao: 'Buscar produto individual' },
    { codigo: 15, descricao: 'Adicionar produto' },
    { codigo: 16, descricao: 'Atualizar produto' },
    { codigo: 17, descricao: 'Deletar produto' },
    { codigo: 18, descricao: 'Buscar imagens de produto' },
    { codigo: 19, descricao: 'Adicionar imagem de produto' },
    { codigo: 20, descricao: 'Atualizar imagem de produto' },
    { codigo: 21, descricao: 'Deletar imagem de produto' },
    { codigo: 22, descricao: 'Buscar vendas' },
    { codigo: 23, descricao: 'Adicionar venda' },
    { codigo: 24, descricao: 'Atualizar venda' },
    { codigo: 25, descricao: 'Deletar venda' },
    { codigo: 26, descricao: 'Buscar últimas consultas' }, 
  ];

  // Inserir cada ação com código específico
  acoes.forEach((acao) => {
    pgm.sql(
      `INSERT INTO "CDACAO" ("CDACAOID", "CDACAODESCRICAO") VALUES (${acao.codigo}, '${acao.descricao}')`
    );
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  // Remover índice
  pgm.dropIndex('LCAUDITORIA', 'LCAUDSENHAID');

  // Remover coluna
  pgm.dropColumn('LCAUDITORIA', 'LCAUDSENHAID');


  
};

