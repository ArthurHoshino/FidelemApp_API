/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.alterColumn('LCAUDITORIA', 'LCAUDDESCRICAO', {
    type: 'varchar(1000)',
    notNull: true,
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.alterColumn('LCAUDITORIA', 'LCAUDDESCRICAO', {
    type: 'varchar(100)',
    notNull: true,
  });
};
