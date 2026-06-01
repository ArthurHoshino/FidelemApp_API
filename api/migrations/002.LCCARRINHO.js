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
    LCCARPRODUTOID: {
      type: 'integer',
      notNull: true,
      references: '"CDPRODUTO"',
      onDelete: 'NO ACTION',
    },
    LCCARUSUARIOID: {
      type: 'integer',
      notNull: true,
      references: '"CDSENHA"',
      onDelete: 'NO ACTION',
    },
    LCCARQUANTIDADE: { type: 'integer', notNull: true },
  });

  pgm.addConstraint('LCCARRINHO', 'lccarrinho_produto_usuario_unique', {
    unique: ['LCCARPRODUTOID', 'LCCARUSUARIOID'],
  });

  pgm.createIndex('LCCARRINHO', 'LCCARPRODUTOID');
  pgm.createIndex('LCCARRINHO', 'LCCARUSUARIOID');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.dropTable('LCCARRINHO');
};
