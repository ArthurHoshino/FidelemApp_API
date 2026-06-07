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
    (7, 'VISUALIZACAO_PRODUTO')
    ON CONFLICT ("CDACAOID") DO UPDATE SET "CDACAODESCRICAO" = EXCLUDED."CDACAODESCRICAO";
  `);
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  pgm.sql(`
    DELETE FROM "CDACAO" WHERE "CDACAOID" = 7;
  `);
};
