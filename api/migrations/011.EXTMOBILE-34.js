/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.alterColumn('CDSENHA', 'CDSESENHA', {
    type: 'varchar(255)',
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.alterColumn('CDSENHA', 'CDSESENHA', {
    type: 'varchar(50)',
  });
};
