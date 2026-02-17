import fs from 'fs';
import path from 'path';

const scopedFiles = [
  'app/product-form.tsx',
  'app/index.tsx',
  'app/compare.tsx',
  'app/product-price-detail.tsx',
  'src/features/productForm/hooks/useProductFormController.ts',
  'src/features/compare/hooks/useCompareScreenController.ts',
  'src/features/productPriceDetail/hooks/useProductPriceDetailController.ts'
];

describe('scoped flows avoid useState', () => {
  test.each(scopedFiles)('%s does not use useState', (relativePath) => {
    const absolutePath = path.resolve(process.cwd(), relativePath);
    const source = fs.readFileSync(absolutePath, 'utf-8');

    expect(source).not.toMatch(/\buseState\s*\(/);
    expect(source).not.toMatch(/\buseState\b/);
  });
});
