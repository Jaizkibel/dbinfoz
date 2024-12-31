class DatabaseAdapter {
  constructor(config) {
    this.config = config; // Store the configuration object
  }

  async listDatabases() {
    throw new Error("Not implemented");
  }

  async listTables(schemaName = null) {
    throw new Error("Not implemented");
  }

  async getTableSchema(tableName, schemaName = null) {
    throw new Error("Not implemented");
  }

  async getTableIndexes(tableName, schemaName = null) {
    throw new Error("Not implemented");
  }

  async getTableConstraints(tableName, schemaName = null) {
    throw new Error("Not implemented");
  }

  async getViewDefinition(tableName, schemaName = null) {
    throw new Error("Not implemented");
  }

  async getAllTablesAndSchemas(schemaName = null) {
    throw new Error("Not implemented");
  }

  async runQuery(query) {
    throw new Error("Not implemented");
  }
}

export default DatabaseAdapter;
