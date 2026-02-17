import { PropsWithChildren, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import {
  createProductPriceDetailScreenStore,
  ProductPriceDetailScreenStoreApi,
  ProductPriceDetailScreenStoreDependencies
} from './createProductPriceDetailScreenStore';
import { ProductPriceDetailScreenStoreState } from '../model/productPriceDetailScreenModel';

const ProductPriceDetailScreenStoreContext =
  createContext<ProductPriceDetailScreenStoreApi | null>(null);

type ProductPriceDetailScreenStoreProviderProps = PropsWithChildren<{
  dependencies?: ProductPriceDetailScreenStoreDependencies;
}>;

export const ProductPriceDetailScreenStoreProvider = ({
  children,
  dependencies
}: ProductPriceDetailScreenStoreProviderProps) => {
  const storeRef = useRef<ProductPriceDetailScreenStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProductPriceDetailScreenStore(dependencies);
  }

  return (
    <ProductPriceDetailScreenStoreContext.Provider value={storeRef.current}>
      {children}
    </ProductPriceDetailScreenStoreContext.Provider>
  );
};

export const useProductPriceDetailScreenStoreApi =
  (): ProductPriceDetailScreenStoreApi => {
    const context = useContext(ProductPriceDetailScreenStoreContext);
    if (!context) {
      throw new Error(
        'useProductPriceDetailScreenStoreApi must be used inside ProductPriceDetailScreenStoreProvider'
      );
    }

    return context;
  };

export const useProductPriceDetailScreenStore = <T,>(
  selector: (state: ProductPriceDetailScreenStoreState) => T
): T => {
  const store = useProductPriceDetailScreenStoreApi();
  return useStore(store, selector);
};

export const useProductPriceDetailScreenStoreWithEquality = <T,>(
  selector: (state: ProductPriceDetailScreenStoreState) => T,
  equalityFn: (left: T, right: T) => boolean
): T => {
  const store = useProductPriceDetailScreenStoreApi();
  return useStoreWithEqualityFn(store, selector, equalityFn);
};
