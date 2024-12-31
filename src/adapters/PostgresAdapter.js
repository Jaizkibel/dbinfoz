import pkg from "pg";
const { Pool } = pkg;

import DatabaseAdapter from "./DatabaseAdapter.js";

class PostgresAdapter extends DatabaseAdapter {
  constructor(config) {
    super(config);
    this.pool = new Pool(config);
  }

  async listDatabases() {
    const query =
      "SELECT datname FROM pg_database WHERE datistemplate = false;";
    const client = await this.pool.connect();
    try {
      const res = await client.query(query);
      return res.rows.map((row) => row.datname);
    } finally {
      client.release();
    }
  }

  async listTables(schemaName = null, excludePattern = '') {
    const schema = schemaName ?? 'public'
    const exclude = excludePattern ?? ''
    const query = `
    SELECT table_schema, table_name, 
        CASE WHEN table_type = 'VIEW' THEN 'view' ELSE 'table' END AS table_type
    FROM information_schema.tables
    WHERE table_catalog = $1 and table_schema like $2 AND ($3 = '' OR table_name !~* $3)
    union all
    select schemaname, matviewname, 'materialized view' from pg_matviews
    WHERE current_database() = $1 and schemaname like $2 AND ($3 = '' OR matviewname !~* $3)`;
    const client = await this.pool.connect();
    try {
      const res = await client.query(query, [this.config.database, schema, exclude]);
    //   return res.rows.map((row) => {row.table_name});
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getTableSchema(tableName, schemaName = null) {
    const schema = schemaName ?? 'public'
    const query = `
    SELECT
      a.attname AS column_name,
      format_type(a.atttypid, a.atttypmod)||case when a.attnotnull then ' not null' else '' end AS data_type
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = $1 AND c.relname like $2
    AND a.attnum > 0
    ORDER BY a.attnum`;
    const client = await this.pool.connect();
    try {
      const res = await client.query(query, [schema, tableName]);
      return res.rows.reduce((schema, row) => {
        schema[row.column_name] = row.data_type;
        return schema;
      }, {});
    } finally {
      client.release();
    }
  }

  async getTableIndexes(tableName, schemaName = null) {
    const schema = schemaName ?? 'public'
    const query = `
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = $1 AND tablename = $2`;
    const client = await this.pool.connect();
    try {
      const res = await client.query(query, [schema, tableName]);
    //   return res.rows.reduce((schema, row) => {
        // schema[row.column_name] = row.data_type;
        // return schema;
    //   }, {});
        return res.rows;
    } finally {
      client.release();
    }
  }

  async getTableConstaints(tableName, schemaName = null) {
    const schema = schemaName ?? 'public'
    const query = `
    SELECT conname AS constraint_name,
         pg_get_constraintdef(c.oid) AS constraint_definition
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = $1 AND conrelid::regclass = $2::regclass`;
    const client = await this.pool.connect();
    try {
      const res = await client.query(query, [schema, tableName]);
    //   return res.rows.reduce((schema, row) => {
        // schema[row.column_name] = row.data_type;
        // return schema;
    //   }, {});
        return res.rows
    } finally {
      client.release();
    }
  }

  async getViewDefinition(tableName, schemaName = null) {
    throw new Error("Not implemented");
  }

  async getAllTablesAndSchemas(schemaName = null) {
    const tables = await this.listTables(schemaName);
    const schemas = {};
    for (const table of tables) {
      schemas[table.table_name] = await this.getTableSchema(table.table_name, schemaName);
    }
    return schemas;
  }

  async runQuery(query) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(query);
      return res.rows;
    } finally {
      client.release();
    }
  }
}

export default PostgresAdapter;
