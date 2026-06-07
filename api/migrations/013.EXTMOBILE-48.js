/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // Tabela: CDPRIVILEGIO (Catálogo de Permissões)
  pgm.createTable('CDPRIVILEGIO', {
    CDPRIVID: { type: 'serial', primaryKey: true },
    CDPRIVCHAVE: { type: 'varchar(100)', notNull: true, unique: true },
    CDPRIVNOME: { type: 'varchar(100)', notNull: true },
    CDPRIVMODULO: { type: 'varchar(50)', notNull: true },
  });

  // Tabela: LCPRIVILEGIO (Ligação Cargo <-> Privilégio)
  pgm.createTable('LCPRIVILEGIO', {
    CDCARID: {
      type: 'integer',
      notNull: true,
      references: '"CDCARGO"',
      onDelete: 'CASCADE', // Se o cargo for deletado, deleta as ligações
    },
    CDPRIVID: {
      type: 'integer',
      notNull: true,
      references: '"CDPRIVILEGIO"',
      onDelete: 'CASCADE',
    },
  }, {
    constraints: {
      primaryKey: ['CDCARID', 'CDPRIVID'],
    }
  });

  // Popula os privilégios iniciais
  pgm.sql(`
    INSERT INTO "CDPRIVILEGIO" ("CDPRIVCHAVE", "CDPRIVNOME", "CDPRIVMODULO") VALUES
    ('FUNCIONARIO_GERENCIAR', 'Gerenciar Funcionários', 'Funcionários'),
    ('CARGO_GERENCIAR', 'Gerenciar Cargos', 'Cargos'),
    ('CATEGORIA_GERENCIAR', 'Gerenciar Categorias', 'Categorias'),
    ('PRODUTO_ADICIONAR', 'Adicionar Produtos', 'Produtos'),
    ('PRODUTO_EDITAR', 'Editar Produtos', 'Produtos'),
    ('PRODUTO_EXCLUIR', 'Excluir Produtos', 'Produtos'),
    ('ESTATISTICAS_VISUALIZAR', 'Visualizar Estatísticas', 'Estatísticas');
  `);
};

/**
 * @param {import('import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropTable('LCPRIVILEGIO');
  pgm.dropTable('CDPRIVILEGIO');
};
