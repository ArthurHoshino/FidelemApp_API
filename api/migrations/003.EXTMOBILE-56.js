/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.createTable('LCCARRINHO', {
    LCCARID: { type: 'serial', primaryKey: true },
    LCCARSENHAID: {
      type: 'integer',
      notNull: true,
      references: '"CDSENHA"',
      onDelete: 'NO ACTION',
    },
    LCCARPRODUTOID: {
      type: 'integer',
      notNull: true,
      references: '"CDPRODUTO"',
      onDelete: 'NO ACTION',
    },
    LCCARQUANTIDADE: {
      type: 'integer',
      notNull: true,
    },
    LCCAREMPRESAID: {
      type: 'integer',
      notNull: true,
      references: '"CDEMPRESA"',
      onDelete: 'NO ACTION',
    },
  });

  pgm.createIndex('LCCARRINHO', 'LCCARSENHAID');
  pgm.createIndex('LCCARRINHO', 'LCCARPRODUTOID');
  pgm.createIndex('LCCARRINHO', 'LCCAREMPRESAID');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropTable('LCCARRINHO');
};
