/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {

  // Adicionando dependencia com a tabela CDEMPRESA
  pgm.addColumn('CDCATEGORIA', {
    CDCATEMPRESAID: {
      type: 'integer',
      notNull: true,
      references: '"CDEMPRESA"', 
      onDelete: 'NO ACTION',
    },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  // Remove a coluna adicionada no rollback

  pgm.dropColumn('CDCATEGORIA', 'CDCATEMPRESAID');

};