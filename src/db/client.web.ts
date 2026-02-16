type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

type UnsupportedWebResult = {
  changes: number;
  lastInsertRowId: number;
};

const unsupportedOnWeb = (methodName: string): never => {
  throw new Error(`${methodName} is not available on web. Use webStore-backed repositories instead.`);
};

export const runSql = async (
  _sql: string,
  _params: SqlParams = []
): Promise<UnsupportedWebResult> => unsupportedOnWeb('runSql');

export const getAllSql = async <T>(_sql: string, _params: SqlParams = []): Promise<T[]> =>
  unsupportedOnWeb('getAllSql');

export const getFirstSql = async <T>(_sql: string, _params: SqlParams = []): Promise<T | null> =>
  unsupportedOnWeb('getFirstSql');

export const execSqlBatch = async (_sql: string): Promise<void> => unsupportedOnWeb('execSqlBatch');
