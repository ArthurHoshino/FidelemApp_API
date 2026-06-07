/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  pgm.sql(`
    INSERT INTO "CDACAO" ("CDACAOID", "CDACAODESCRICAO") VALUES
      (8,  'CADASTRO_CARGO'),
      (9,  'EDICAO_CARGO'),
      (10, 'REMOCAO_CARGO'),
      (11, 'CADASTRO_CATEGORIA'),
      (12, 'EDICAO_CATEGORIA'),
      (13, 'REMOCAO_CATEGORIA'),
      (14, 'CADASTRO_USUARIO'),
      (15, 'REMOCAO_USUARIO')
    ON CONFLICT DO NOTHING;
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM "CDACAO" WHERE "CDACAOID" IN (8,9,10,11,12,13,14,15);
  `);
};
