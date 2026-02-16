import * as SQLite from 'expo-sqlite';

type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('japan-price-tracker.db').then(async (db) => {
      await db.execAsync('PRAGMA foreign_keys = ON;');
      return db;
    });
  }

  return dbPromise;
};

export const runSql = async (sql: string, params: SqlParams = []): Promise<SQLite.SQLiteRunResult> => {
  const db = await getDatabase();
  return db.runAsync(sql, params as never);
};

export const getAllSql = async <T>(sql: string, params: SqlParams = []): Promise<T[]> => {
  const db = await getDatabase();
  return db.getAllAsync<T>(sql, params as never);
};

export const getFirstSql = async <T>(sql: string, params: SqlParams = []): Promise<T | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<T>(sql, params as never);
  return row ?? null;
};

export const execSqlBatch = async (sql: string): Promise<void> => {
  const db = await getDatabase();
  await db.execAsync(sql);
};
