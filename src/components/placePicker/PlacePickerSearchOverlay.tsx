import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/tokens';

type PlacePickerSearchOverlayProps = {
  top?: number;
  zIndex?: number;
  children: ReactNode;
};

export const PlacePickerSearchOverlay = ({
  top = spacing.md,
  zIndex = 30,
  children
}: PlacePickerSearchOverlayProps) => {
  return <View style={[styles.container, { top, zIndex }]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    left: spacing.md,
    position: 'absolute',
    right: spacing.md
  }
});
