import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { typography } from '../../theme/tokens';
import { AppCard } from '../ui/AppCard';

type ProductPriceEntryCardProps = {
  width: number;
  productName: string;
  productNote?: string;
  priceLabel: string;
  observedLabel: string;
  imageSource: ImageSourcePropType;
};

export const ProductPriceEntryCard = ({
  width,
  productName,
  productNote,
  priceLabel,
  observedLabel,
  imageSource
}: ProductPriceEntryCardProps) => {
  return (
    <AppCard padded={false} style={[styles.card, { width }]}>
      <View style={styles.imageWrap}>
        <Image source={imageSource} style={styles.image} />
      </View>

      <View style={styles.metaBlock}>
        <Text numberOfLines={1} style={styles.productName}>
          {productName}
        </Text>
        {productNote ? (
          <Text numberOfLines={1} style={styles.productNote}>
            {productNote}
          </Text>
        ) : null}
      </View>

      <View style={styles.priceBlock}>
        <Text numberOfLines={1} style={styles.priceLabel}>
          {priceLabel}
        </Text>
        <Text numberOfLines={1} style={styles.observedLabel}>
          {observedLabel}
        </Text>
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: 32,
    flexDirection: 'row',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  imageWrap: {
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    width: 64
  },
  image: {
    height: 64,
    width: 64
  },
  metaBlock: {
    flex: 1,
    marginRight: 10
  },
  productName: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 19
  },
  productNote: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  priceBlock: {
    alignItems: 'flex-end'
  },
  priceLabel: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28
  },
  observedLabel: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 0
  }
});
