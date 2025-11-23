/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const up = (pgm) => {
  // 1. Tabelas Independentes (Nível 1)
  
  // Tabela: CDEMPRESA
  pgm.createTable('CDEMPRESA', {
    CDEMPID: { type: 'serial', primaryKey: true },
    CDEMPNOME: { type: 'varchar(45)', notNull: false },
  });

  // Tabela: CDCATEGORIA
  pgm.createTable('CDCATEGORIA', {
    CDCATID: { type: 'serial', primaryKey: true },
    CDCATNOME: { type: 'varchar(45)', notNull: false },
  });

  // Tabela: CDACAO
  pgm.createTable('CDACAO', {
    CDACAOID: { type: 'serial', primaryKey: true },
    CDACAODESCRICAO: { type: 'varchar(45)', notNull: false },
  });

  // 2. Tabelas com Dependências de Nível 1

  // Tabela: CDCARGO (Depende de CDEMPRESA)
  pgm.createTable('CDCARGO', {
    CDCARID: { type: 'serial', primaryKey: true },
    CDCARNOME: { type: 'varchar(45)', notNull: false },
    CDCAREMPRESAID: {
      type: 'integer',
      notNull: true,
      references: '"CDEMPRESA"', // Aspas duplas garantem referência correta
      onDelete: 'NO ACTION',
    },
  });

  // Tabela: CDEXCECAO (Depende de CDEMPRESA)
  pgm.createTable('CDEXCECAO', {
    CDEXID: { type: 'serial', primaryKey: true },
    CDEXDESCRICAO: { type: 'varchar(200)', notNull: true },
    CDEXDATA: { type: 'timestamp', notNull: true },
    CDEXEMPRESAID: {
      type: 'integer',
      notNull: true,
      references: '"CDEMPRESA"',
      onDelete: 'NO ACTION',
    },
  });

  // 3. Tabelas com Dependências de Nível 2

  // Tabela: CDSENHA (Depende de CDCARGO)
  pgm.createTable('CDSENHA', {
    CDSEID: { type: 'serial', primaryKey: true },
    CDSENOME: { type: 'varchar(255)', notNull: true },
    CDSESENHA: { type: 'varchar(50)', notNull: true },
    CDSECPFCNPJ: { type: 'varchar(14)', notNull: false },
    CDSEEMAIL: { type: 'varchar(255)', notNull: true },
    CDSETELEFONE: { type: 'varchar(45)', notNull: false },
    CDSECARGOID: {
      type: 'integer',
      notNull: true,
      references: '"CDCARGO"',
      onDelete: 'NO ACTION',
    },
  });

  // 4. Tabelas com Dependências de Nível 3 e Mistas

  // Tabela: FIDELSESSAO (Depende de CDSENHA)
  pgm.createTable('FIDELSESSAO', {
    FIDELSESID: { type: 'varchar(128)', primaryKey: true }, // ID não é serial aqui
    FIDELSESEXPIRA: { type: 'integer', notNull: true },
    FIDELSESDTSESSAO: { type: 'timestamp', notNull: true },
    FIDELSESSENHAID: {
      type: 'integer',
      notNull: true,
      references: '"CDSENHA"',
      onDelete: 'NO ACTION',
    },
  });

  // Tabela: LCVENDA (Depende de CDSENHA)
  pgm.createTable('LCVENDA', {
    LCVENID: { type: 'serial', primaryKey: true },
    LCVENSENHAID: {
      type: 'integer',
      notNull: true,
      references: '"CDSENHA"',
      onDelete: 'NO ACTION',
    },
    LCVENPRODUTOS: { type: 'varchar(500)', notNull: true },
  });

  // Tabela: CDPRODUTO (Depende de CDEMPRESA e CDCATEGORIA)
  pgm.createTable('CDPRODUTO', {
    CDPRODID: { type: 'serial', primaryKey: true },
    CDPRODNOME: { type: 'varchar(45)', notNull: false },
    CDPRODDESCRICAO: { type: 'varchar(45)', notNull: false },
    CDPRODPRECOREAL: { type: 'numeric(10,2)', notNull: false },
    CDPRODPRECOPONTO: { type: 'integer', notNull: false },
    CDPRODPRECODESCONTO: { type: 'numeric(10,2)', notNull: false },
    CDPRODQTDESTOQUE: { type: 'integer', notNull: false },
    CDPRODEMPRESAID: {
      type: 'integer',
      notNull: true,
      references: '"CDEMPRESA"',
      onDelete: 'NO ACTION',
    },
    CDPRODCATEGORIAID: {
      type: 'integer',
      notNull: true,
      references: '"CDCATEGORIA"',
      onDelete: 'NO ACTION',
    },
  });

  // Tabela: LCAUDITORIA (Depende de CDACAO e CDEMPRESA)
  pgm.createTable('LCAUDITORIA', {
    LCAUDID: { type: 'serial', primaryKey: true },
    LCAUDDESCRICAO: { type: 'varchar(100)', notNull: true },
    LCAUDDATA: { type: 'timestamp', notNull: true },
    LCAUDACAOID: {
      type: 'integer',
      notNull: true,
      references: '"CDACAO"',
      onDelete: 'NO ACTION',
    },
    LCAUDEMPRESAID: {
      type: 'integer',
      notNull: true,
      references: '"CDEMPRESA"',
      onDelete: 'NO ACTION',
    },
  });

  // 5. Tabelas Finais

  // Tabela: CDPRODUTOIMAGEM (Depende de CDPRODUTO)
  pgm.createTable('CDPRODUTOIMAGEM', {
    CDPRODIMGID: { type: 'serial', primaryKey: true },
    CDPRODIMGBLOB: { type: 'bytea', notNull: true }, // 'bytea' é o BLOB do Postgres
    CDPRODIMGPRODUTOID: {
      type: 'integer',
      notNull: true,
      references: '"CDPRODUTO"',
      onDelete: 'NO ACTION',
    },
  });

  // Criação de índices explícitos (Opcional, mas recomendado para FKs)
  pgm.createIndex('CDCARGO', 'CDCAREMPRESAID');
  pgm.createIndex('CDSENHA', 'CDSECARGOID');
  pgm.createIndex('CDPRODUTO', 'CDPRODEMPRESAID');
  pgm.createIndex('CDPRODUTO', 'CDPRODCATEGORIAID');
  pgm.createIndex('FIDELSESSAO', 'FIDELSESSENHAID');
  pgm.createIndex('CDPRODUTOIMAGEM', 'CDPRODIMGPRODUTOID');
  pgm.createIndex('LCVENDA', 'LCVENSENHAID');
  pgm.createIndex('LCAUDITORIA', 'LCAUDACAOID');
  pgm.createIndex('LCAUDITORIA', 'LCAUDEMPRESAID');
  pgm.createIndex('CDEXCECAO', 'CDEXEMPRESAID');
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
export const down = (pgm) => {
  // A ordem de drop deve ser inversa à de criação para não quebrar FKs
  pgm.dropTable('CDPRODUTOIMAGEM');
  pgm.dropTable('LCAUDITORIA');
  pgm.dropTable('CDPRODUTO');
  pgm.dropTable('LCVENDA');
  pgm.dropTable('FIDELSESSAO');
  pgm.dropTable('CDSENHA');
  pgm.dropTable('CDEXCECAO');
  pgm.dropTable('CDCARGO');
  pgm.dropTable('CDACAO');
  pgm.dropTable('CDCATEGORIA');
  pgm.dropTable('CDEMPRESA');
};