import { selectLatestByStore } from '../priceEntriesRepo';

describe('selectLatestByStore', () => {
  it('keeps one row per store and picks newest observedAt first', () => {
    const rows = [
      {
        storeId: 's1',
        observedAt: '2026-02-12T10:00:00.000Z',
        createdAt: '2026-02-12T10:01:00.000Z'
      },
      {
        storeId: 's1',
        observedAt: '2026-02-12T11:00:00.000Z',
        createdAt: '2026-02-12T11:00:30.000Z'
      },
      {
        storeId: 's2',
        observedAt: '2026-02-12T09:00:00.000Z',
        createdAt: '2026-02-12T09:00:10.000Z'
      }
    ];

    const latest = selectLatestByStore(rows);

    expect(latest).toHaveLength(2);
    expect(latest.find((row) => row.storeId === 's1')?.observedAt).toBe('2026-02-12T11:00:00.000Z');
    expect(latest.find((row) => row.storeId === 's2')?.observedAt).toBe('2026-02-12T09:00:00.000Z');
  });

  it('uses newest createdAt when observedAt is equal', () => {
    const latest = selectLatestByStore([
      {
        storeId: 's3',
        observedAt: '2026-02-12T11:00:00.000Z',
        createdAt: '2026-02-12T11:01:00.000Z'
      },
      {
        storeId: 's3',
        observedAt: '2026-02-12T11:00:00.000Z',
        createdAt: '2026-02-12T11:02:00.000Z'
      }
    ]);

    expect(latest[0].createdAt).toBe('2026-02-12T11:02:00.000Z');
  });
});
