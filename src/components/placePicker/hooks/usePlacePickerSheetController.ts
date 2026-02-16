import { useCallback, useMemo, useRef, useState } from 'react';
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
};

export const usePlacePickerSheetController = ({
  initialHiddenOffset,
  useNativeDriver
}: UsePlacePickerSheetControllerParams) => {
  const [isPlaceInfoVisible, setIsPlaceInfoVisible] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetTranslateY = useRef(new Animated.Value(initialHiddenOffset)).current;

  const getSheetHiddenOffset = useCallback(() => {
    return sheetHeight > 0 ? sheetHeight : initialHiddenOffset;
  }, [initialHiddenOffset, sheetHeight]);

  const animateSheet = useCallback(
    (nextVisible: boolean, immediate = false) => {
      const hiddenOffset = getSheetHiddenOffset();

      if (immediate) {
        sheetTranslateY.setValue(nextVisible ? 0 : hiddenOffset);
        setIsPlaceInfoVisible(nextVisible);
        return;
      }

      if (nextVisible) {
        setIsPlaceInfoVisible(true);
      }

      Animated.timing(sheetTranslateY, {
        duration: 220,
        toValue: nextVisible ? 0 : hiddenOffset,
        useNativeDriver
      }).start(({ finished }) => {
        if (!nextVisible && finished) {
          setIsPlaceInfoVisible(false);
        }
      });
    },
    [getSheetHiddenOffset, sheetTranslateY, useNativeDriver]
  );

  const showPlaceInfoSheet = useCallback(() => {
    animateSheet(true);
  }, [animateSheet]);

  const hidePlaceInfoSheet = useCallback(
    (immediate = false) => {
      animateSheet(false, immediate);
    },
    [animateSheet]
  );

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => isPlaceInfoVisible,
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

  const resetSheetForSession = useCallback(
    (showInitially: boolean) => {
      if (showInitially) {
        showPlaceInfoSheet();
        return;
      }

      hidePlaceInfoSheet(true);
    },
    [hidePlaceInfoSheet, showPlaceInfoSheet]
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
    hidePlaceInfoSheet,
    isPlaceInfoVisible,
    resetSheetForSession,
    sheetHiddenOffset,
    sheetPanHandlers: sheetPanResponder.panHandlers,
    sheetTranslateY,
    showPlaceInfoSheet
  };
};
