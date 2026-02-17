import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

type SheetLayoutEvent = {
  nativeEvent: {
    layout: {
      height: number;
    };
  };
};

type UsePlacePickerSheetControllerParams = {
  initialHiddenOffset: number;
  useNativeDriver: boolean;
  isPlaceInfoVisible: boolean;
  showPlaceInfoSheet: () => void;
  hidePlaceInfoSheet: () => void;
};

export const usePlacePickerSheetController = ({
  initialHiddenOffset,
  useNativeDriver,
  isPlaceInfoVisible,
  showPlaceInfoSheet,
  hidePlaceInfoSheet
}: UsePlacePickerSheetControllerParams) => {
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetTranslateY = useRef(new Animated.Value(initialHiddenOffset)).current;
  const previousVisibilityRef = useRef(isPlaceInfoVisible);

  const getSheetHiddenOffset = useCallback(() => {
    return sheetHeight > 0 ? sheetHeight : initialHiddenOffset;
  }, [initialHiddenOffset, sheetHeight]);

  const animateSheet = useCallback(
    (nextVisible: boolean) => {
      const hiddenOffset = getSheetHiddenOffset();

      Animated.timing(sheetTranslateY, {
        duration: 220,
        toValue: nextVisible ? 0 : hiddenOffset,
        useNativeDriver
      }).start();
    },
    [getSheetHiddenOffset, sheetTranslateY, useNativeDriver]
  );

  useEffect(() => {
    if (previousVisibilityRef.current === isPlaceInfoVisible) {
      return;
    }

    previousVisibilityRef.current = isPlaceInfoVisible;
    animateSheet(isPlaceInfoVisible);
  }, [animateSheet, isPlaceInfoVisible]);

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          if (!isPlaceInfoVisible) {
            return false;
          }

          const isVerticalDrag = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
          const exceedsActivationThreshold = gestureState.dy > 6;
          return isVerticalDrag && exceedsActivationThreshold;
        },
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!isPlaceInfoVisible || gestureState.dy <= 0) {
            return;
          }

          sheetTranslateY.setValue(Math.min(gestureState.dy, getSheetHiddenOffset()));
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldHide =
            gestureState.dy > 70 || gestureState.vy > 1 || (gestureState.dy > 35 && gestureState.vy >= 0);

          if (shouldHide) {
            hidePlaceInfoSheet();
          } else {
            showPlaceInfoSheet();
          }
        },
        onPanResponderTerminate: () => {
          showPlaceInfoSheet();
        }
      }),
    [getSheetHiddenOffset, hidePlaceInfoSheet, isPlaceInfoVisible, showPlaceInfoSheet, sheetTranslateY]
  );

  const handleSheetLayout = useCallback(
    (event: SheetLayoutEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0) {
        return;
      }

      setSheetHeight(nextHeight);
      if (!isPlaceInfoVisible) {
        sheetTranslateY.setValue(nextHeight);
      }
    },
    [isPlaceInfoVisible, sheetTranslateY]
  );

  const sheetHiddenOffset = sheetHeight > 0 ? sheetHeight : initialHiddenOffset;
  const controlsLiftDistance = useMemo(
    () => Math.max(72, Math.min(sheetHiddenOffset, 320)),
    [sheetHiddenOffset]
  );

  const controlsTranslateY = useMemo(
    () =>
      sheetTranslateY.interpolate({
        inputRange: [0, sheetHiddenOffset],
        outputRange: [-controlsLiftDistance, 0],
        extrapolate: 'clamp'
      }),
    [controlsLiftDistance, sheetHiddenOffset, sheetTranslateY]
  );

  return {
    controlsTranslateY,
    getSheetHiddenOffset,
    handleSheetLayout,
    sheetHiddenOffset,
    sheetPanHandlers: sheetPanResponder.panHandlers,
    sheetTranslateY
  };
};
