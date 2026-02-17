import { ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { shadows, spacing } from '../../theme/tokens';

type PlacePickerInfoSheetProps = {
  translateY: Animated.Value;
  isVisible: boolean;
  onLayout: (event: { nativeEvent: { layout: { height: number } } }) => void;
  panHandlers?: object;
  zIndex?: number;
  bodyPaddingBottom?: number;
  keyboardOverlapOffset?: number;
  children: ReactNode;
};

export const PlacePickerInfoSheet = ({
  translateY,
  isVisible,
  onLayout,
  panHandlers,
  zIndex,
  bodyPaddingBottom,
  keyboardOverlapOffset = 0,
  children
}: PlacePickerInfoSheetProps) => {
  return (
    <Animated.View
      onLayout={onLayout}
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        styles.sheet,
        zIndex ? { zIndex } : null,
        keyboardOverlapOffset > 0 ? { bottom: -keyboardOverlapOffset } : null,
        { transform: [{ translateY }] }
      ]}
      {...panHandlers}
    >
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>
      <View style={[styles.body, bodyPaddingBottom ? { paddingBottom: bodyPaddingBottom } : null]}>{children}</View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    ...shadows.floating
  },
  handleWrap: {
    alignItems: 'center',
    paddingBottom: spacing.xxs,
    paddingTop: spacing.xs
  },
  handle: {
    backgroundColor: '#D1D1D6',
    borderRadius: 999,
    height: 4,
    width: 36
  },
  body: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs
  }
});
