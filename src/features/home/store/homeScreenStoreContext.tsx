import { PropsWithChildren, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import {
  createHomeScreenStore,
  HomeScreenStoreApi,
  HomeScreenStoreDependencies
} from './createHomeScreenStore';
import { HomeScreenStoreState } from '../model/homeScreenModel';

const HomeScreenStoreContext = createContext<HomeScreenStoreApi | null>(null);

type HomeScreenStoreProviderProps = PropsWithChildren<{
  dependencies?: HomeScreenStoreDependencies;
}>;

export const HomeScreenStoreProvider = ({
  children,
  dependencies
}: HomeScreenStoreProviderProps) => {
  const storeRef = useRef<HomeScreenStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createHomeScreenStore(dependencies);
  }

  return (
    <HomeScreenStoreContext.Provider value={storeRef.current}>
      {children}
    </HomeScreenStoreContext.Provider>
  );
};

export const useHomeScreenStoreApi = (): HomeScreenStoreApi => {
  const context = useContext(HomeScreenStoreContext);
  if (!context) {
    throw new Error('useHomeScreenStoreApi must be used inside HomeScreenStoreProvider');
  }

  return context;
};

export const useHomeScreenStore = <T,>(
  selector: (state: HomeScreenStoreState) => T
): T => {
  const store = useHomeScreenStoreApi();
  return useStore(store, selector);
};

export const useHomeScreenStoreWithEquality = <T,>(
  selector: (state: HomeScreenStoreState) => T,
  equalityFn: (left: T, right: T) => boolean
): T => {
  const store = useHomeScreenStoreApi();
  return useStoreWithEqualityFn(store, selector, equalityFn);
};
