import { PropsWithChildren, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import {
  CompareScreenStoreApi,
  CompareScreenStoreDependencies,
  createCompareScreenStore
} from './createCompareScreenStore';
import { CompareScreenStoreState } from '../model/compareScreenModel';

const CompareScreenStoreContext = createContext<CompareScreenStoreApi | null>(null);

type CompareScreenStoreProviderProps = PropsWithChildren<{
  dependencies?: CompareScreenStoreDependencies;
}>;

export const CompareScreenStoreProvider = ({
  children,
  dependencies
}: CompareScreenStoreProviderProps) => {
  const storeRef = useRef<CompareScreenStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createCompareScreenStore(dependencies);
  }

  return (
    <CompareScreenStoreContext.Provider value={storeRef.current}>
      {children}
    </CompareScreenStoreContext.Provider>
  );
};

export const useCompareScreenStoreApi = (): CompareScreenStoreApi => {
  const context = useContext(CompareScreenStoreContext);
  if (!context) {
    throw new Error(
      'useCompareScreenStoreApi must be used inside CompareScreenStoreProvider'
    );
  }

  return context;
};

export const useCompareScreenStore = <T,>(
  selector: (state: CompareScreenStoreState) => T
): T => {
  const store = useCompareScreenStoreApi();
  return useStore(store, selector);
};

export const useCompareScreenStoreWithEquality = <T,>(
  selector: (state: CompareScreenStoreState) => T,
  equalityFn: (left: T, right: T) => boolean
): T => {
  const store = useCompareScreenStoreApi();
  return useStoreWithEqualityFn(store, selector, equalityFn);
};
