/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.addColumn('CDPRODUTOIMAGEM', {
    CDPRODIMGORDEM: {
      type: 'integer',
      notNull: false,
    },
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropColumn('CDPRODUTOIMAGEM', 'CDPRODIMGORDEM');
};
