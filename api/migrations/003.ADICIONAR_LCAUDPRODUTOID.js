/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // Adicionar campo LCAUDPRODUTOID na tabela LCAUDITORIA para identificar o produto buscado
  // Este campo será usado para rastrear produtos buscados individualmente
  pgm.addColumn('LCAUDITORIA', {
    LCAUDPRODUTOID: {
      type: 'integer',
      notNull: false,
      references: '"CDPRODUTO"',
      onDelete: 'NO ACTION',
    },
  });

  // Criar índice para o novo campo (útil para queries de "últimos produtos buscados")
  pgm.createIndex('LCAUDITORIA', 'LCAUDPRODUTOID');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  // Remover índice
  pgm.dropIndex('LCAUDITORIA', 'LCAUDPRODUTOID');

  // Remover coluna
  pgm.dropColumn('LCAUDITORIA', 'LCAUDPRODUTOID');
};

