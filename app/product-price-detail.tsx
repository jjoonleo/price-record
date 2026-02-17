import { ProductPriceDetailScreenContainer } from '../src/features/productPriceDetail/ProductPriceDetailScreenContainer';
import { ProductPriceDetailScreenStoreProvider } from '../src/features/productPriceDetail/store/productPriceDetailScreenStoreContext';

export default function ProductPriceDetailRoute() {
  return (
    <ProductPriceDetailScreenStoreProvider>
      <ProductPriceDetailScreenContainer />
    </ProductPriceDetailScreenStoreProvider>
  );
}
