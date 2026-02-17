import { StyleSheet, View } from 'react-native';
import { IconCircleButton } from '../ui/IconCircleButton';

type ProductPriceMapHeaderActionsProps = {
  isFavorite: boolean;
  onBack: () => void;
  onFavorite: () => void;
  onShare: () => void;
};

export const ProductPriceMapHeaderActions = ({
  isFavorite,
  onBack,
  onFavorite,
  onShare
}: ProductPriceMapHeaderActionsProps) => {
  return (
    <View pointerEvents="box-none" style={styles.headerRow}>
      <IconCircleButton
        accessibilityLabel="detail-back-button"
        iconName="chevron-left"
        onPress={onBack}
        size={17}
      />

      <View style={styles.headerActions}>
        <IconCircleButton
          accessibilityLabel="detail-favorite-button"
          iconName={isFavorite ? 'heart' : 'heart-outline'}
          onPress={onFavorite}
          size={16}
        />

        <IconCircleButton
          accessibilityLabel="detail-share-button"
          iconName="share-variant"
          onPress={onShare}
          size={16}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 48,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 60,
    elevation: 60
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12
  }
});
