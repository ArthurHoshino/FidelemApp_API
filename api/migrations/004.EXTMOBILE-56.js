/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.alterColumn('LCVENDA', 'LCVENPRODUTOS', {
    type: 'varchar(2000)',
    notNull: true,
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.alterColumn('LCVENDA', 'LCVENPRODUTOS', {
    type: 'varchar(500)',
    notNull: true,
  });
};
