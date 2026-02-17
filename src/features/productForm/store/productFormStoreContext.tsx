import { PropsWithChildren, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import {
  createProductFormStore,
  ProductFormStoreApi,
  ProductFormStoreDependencies
} from './createProductFormStore';
import { ProductFormStoreState } from '../model/productFormModel';

const ProductFormStoreContext = createContext<ProductFormStoreApi | null>(null);

type ProductFormStoreProviderProps = PropsWithChildren<{
  dependencies?: ProductFormStoreDependencies;
}>;

export const ProductFormStoreProvider = ({
  children,
  dependencies
}: ProductFormStoreProviderProps) => {
  const storeRef = useRef<ProductFormStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createProductFormStore(dependencies);
  }

  return (
    <ProductFormStoreContext.Provider value={storeRef.current}>
      {children}
    </ProductFormStoreContext.Provider>
  );
};

export const useProductFormStoreApi = (): ProductFormStoreApi => {
  const context = useContext(ProductFormStoreContext);
  if (!context) {
    throw new Error('useProductFormStoreApi must be used inside ProductFormStoreProvider');
  }

  return context;
};

export const useProductFormStore = <T,>(
  selector: (state: ProductFormStoreState) => T
): T => {
  const store = useProductFormStoreApi();
  return useStore(store, selector);
};

export const useProductFormStoreWithEquality = <T,>(
  selector: (state: ProductFormStoreState) => T,
  equalityFn: (left: T, right: T) => boolean
): T => {
  const store = useProductFormStoreApi();
  return useStoreWithEqualityFn(store, selector, equalityFn);
};
