declare module 'better-sqlite3' {
  class Database {
    constructor(filename: string, options?: object);
    prepare(sql: string): Statement;
    exec(sql: string): void;
    transaction(fn: () => void): () => void;
    close(): void;
  }
  class Statement {
    run(...params: unknown[]): { lastInsertRowid: number; changes: number };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
  export default Database;
}
