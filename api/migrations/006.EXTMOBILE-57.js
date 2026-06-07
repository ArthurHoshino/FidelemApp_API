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
    (1, 'LOGIN_USUARIO'),
    (2, 'CADASTRO_PRODUTO'),
    (3, 'EDICAO_PRODUTO'),
    (4, 'REMOCAO_PRODUTO'),
    (5, 'RESGATE_RECOMPENSA'),
    (6, 'REALIZACAO_VENDA')
    ON CONFLICT ("CDACAOID") DO UPDATE SET "CDACAODESCRICAO" = EXCLUDED."CDACAODESCRICAO";
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM "CDACAO" WHERE "CDACAOID" IN (1, 2, 3, 4, 5, 6);
  `);
};
