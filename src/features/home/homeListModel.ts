import { HistoryEntry } from '../../types/domain';

export type HomeListItem = {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  cityArea: string;
  priceYen: number;
  observedAt: string;
  createdAt: string;
};

const toHomeListItem = (entry: HistoryEntry): HomeListItem => ({
  productId: entry.productId,
  productName: entry.productName,
  storeId: entry.storeId,
  storeName: entry.storeName,
  cityArea: entry.cityArea,
  priceYen: entry.priceYen,
  observedAt: entry.observedAt,
  createdAt: entry.createdAt
});

const compareByRecency = (
  left: Pick<HomeListItem, 'observedAt' | 'createdAt'>,
  right: Pick<HomeListItem, 'observedAt' | 'createdAt'>
): number => {
  const observedDiff = new Date(left.observedAt).getTime() - new Date(right.observedAt).getTime();
  if (observedDiff !== 0) {
    return observedDiff;
  }

  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
};

const normalizeSearch = (value: string): string => value.trim().toLowerCase();

export const buildLatestEntriesByProduct = (entries: HistoryEntry[]): HomeListItem[] => {
  const latestByProductId = new Map<string, HomeListItem>();

  entries.forEach((entry) => {
    const next = toHomeListItem(entry);
    const current = latestByProductId.get(next.productId);

    if (!current || compareByRecency(next, current) > 0) {
      latestByProductId.set(next.productId, next);
    }
  });

  return [...latestByProductId.values()].sort((left, right) => {
    const recencyDiff = compareByRecency(right, left);
    if (recencyDiff !== 0) {
      return recencyDiff;
    }

    return left.productName.localeCompare(right.productName);
  });
};

export const filterHomeListItems = (items: HomeListItem[], query: string): HomeListItem[] => {
  const keyword = normalizeSearch(query);
  if (!keyword) {
    return items;
  }

  return items.filter((item) => {
    const haystacks = [item.productName, item.storeName, item.cityArea];
    return haystacks.some((value) => normalizeSearch(value).includes(keyword));
  });
};
