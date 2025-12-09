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

  // Inserir ações na CDACAO
  // Códigos de ação baseados nas operações do sistema
  const acoes = [
    { descricao: 'Buscar empresas' },
    { descricao: 'Adicionar empresa' },
    { descricao: 'Atualizar empresa' },
    { descricao: 'Deletar empresa' },
    { descricao: 'Buscar cargos' },
    { descricao: 'Adicionar cargo' },
    { descricao: 'Atualizar cargo' },
    { descricao: 'Deletar cargo' },
    { descricao: 'Buscar usuários' },
    { descricao: 'Adicionar usuário' },
    { descricao: 'Atualizar usuário' },
    { descricao: 'Deletar usuário' },
    { descricao: 'Buscar produtos' },
    { descricao: 'Adicionar produto' },
    { descricao: 'Atualizar produto' },
    { descricao: 'Deletar produto' },
    { descricao: 'Buscar imagens de produto' },
    { descricao: 'Adicionar imagem de produto' },
    { descricao: 'Atualizar imagem de produto' },
    { descricao: 'Deletar imagem de produto' },
    { descricao: 'Buscar vendas' },
    { descricao: 'Adicionar venda' },
    { descricao: 'Atualizar venda' },
    { descricao: 'Deletar venda' },
    { descricao: 'Buscar últimas consultas' }, 
  ];

  // Inserir cada ação usando uma abordagem mais segura
  acoes.forEach((acao) => {
    pgm.sql(
      `INSERT INTO "CDACAO" ("CDACAODESCRICAO") VALUES ($1)`,
      [acao.descricao]
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

