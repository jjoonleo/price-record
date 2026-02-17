import { ProductFormRouteContainer } from '../src/features/productForm/ProductFormRouteContainer';
import { ProductFormStoreProvider } from '../src/features/productForm/store/productFormStoreContext';

export default function ProductFormRoute() {
  return (
    <ProductFormStoreProvider>
      <ProductFormRouteContainer />
    </ProductFormStoreProvider>
  );
}
