export const formatYen = (value: number, locale = 'en-US'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(value);
};

export const formatObservedAt = (isoDate: string, locale = 'en-US'): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const toIsoStringSafe = (input: string): string => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
};

export const compactStoreLabel = (name: string): string => {
  const trimmed = name.trim();
  return trimmed.length > 12 ? `${trimmed.slice(0, 11)}…` : trimmed;
};
