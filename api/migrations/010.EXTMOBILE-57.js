/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createIndex('LCAUDITORIA', ['LCAUDACAOID', 'LCAUDEMPRESAID', 'LCAUDDATA']);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropIndex('LCAUDITORIA', ['LCAUDACAOID', 'LCAUDEMPRESAID', 'LCAUDDATA']);
};
