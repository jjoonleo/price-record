export type HomeProductImage = {
  uri: string;
  backgroundColor: string;
};

const FIGMA_ASSET_BASE = 'http://localhost:3845/assets';

const imageCatalog = {
  nissinCupNoodle: {
    uri: `${FIGMA_ASSET_BASE}/7ca8bff40d21e3f6e28d2722807ceecc47acb021.png`,
    backgroundColor: '#FFEDD5'
  },
  kitkatMatcha: {
    uri: `${FIGMA_ASSET_BASE}/0dc92f91c2b3b4b0d857ce2eb97cbdce664cecf8.png`,
    backgroundColor: '#FEE2E2'
  },
  playstation5Digital: {
    uri: `${FIGMA_ASSET_BASE}/5764f95a4b1423cf41ea82b9a6bbe0bb1d1d8cd9.png`,
    backgroundColor: '#F3F4F6'
  },
  sonyWh1000Xm5: {
    uri: `${FIGMA_ASSET_BASE}/022c0b2f5416371971e146bdf87eacd707dbf36d.png`,
    backgroundColor: '#F3F4F6'
  },
  skIiFacialTreatment: {
    uri: `${FIGMA_ASSET_BASE}/e821a4761b0a3fdaee3e04c967dd857ff1dde499.png`,
    backgroundColor: '#FEF2F2'
  }
} as const;

const normalizeProductName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const getHomeProductImage = (productName: string): HomeProductImage | null => {
  const normalized = normalizeProductName(productName);
  const compact = normalized.replace(/\s+/g, '');

  if (compact.includes('nissincupnoodle')) {
    return imageCatalog.nissinCupNoodle;
  }

  if (compact.includes('kitkat') && compact.includes('matcha')) {
    return imageCatalog.kitkatMatcha;
  }

  if (compact.includes('playstation5') || compact.includes('ps5')) {
    return imageCatalog.playstation5Digital;
  }

  if (compact.includes('sony') && compact.includes('1000xm5')) {
    return imageCatalog.sonyWh1000Xm5;
  }

  if (compact.includes('skii') || (compact.includes('sk') && compact.includes('ii'))) {
    return imageCatalog.skIiFacialTreatment;
  }

  return null;
};
