import { PropsWithChildren, createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { PlacePickerStoreDependencies, PlacePickerStoreState } from '../model/placePickerModel';
import { createPlacePickerStore, PlacePickerStoreApi } from './createPlacePickerStore';

const PlacePickerStoreContext = createContext<PlacePickerStoreApi | null>(null);

type PlacePickerStoreProviderProps = PropsWithChildren<{
  dependencies?: PlacePickerStoreDependencies;
}>;

export const PlacePickerStoreProvider = ({
  children,
  dependencies
}: PlacePickerStoreProviderProps) => {
  const storeRef = useRef<PlacePickerStoreApi | null>(null);

  if (!storeRef.current) {
    storeRef.current = createPlacePickerStore(dependencies);
  }

  return (
    <PlacePickerStoreContext.Provider value={storeRef.current}>
      {children}
    </PlacePickerStoreContext.Provider>
  );
};

export const usePlacePickerStoreApi = (): PlacePickerStoreApi => {
  const context = useContext(PlacePickerStoreContext);
  if (!context) {
    throw new Error('usePlacePickerStoreApi must be used inside PlacePickerStoreProvider');
  }

  return context;
};

export const usePlacePickerStore = <T,>(
  selector: (state: PlacePickerStoreState) => T
): T => {
  const store = usePlacePickerStoreApi();
  return useStore(store, selector);
};

export const usePlacePickerStoreWithEquality = <T,>(
  selector: (state: PlacePickerStoreState) => T,
  equalityFn: (left: T, right: T) => boolean
): T => {
  const store = usePlacePickerStoreApi();
  return useStoreWithEqualityFn(store, selector, equalityFn);
};
