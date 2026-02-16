import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme/tokens';

type DealTone = 'great' | 'standard';

type ProductPriceHeroProps = {
  width: number;
  productName: string;
  priceText: string;
  dealTone: DealTone;
  dealLabel: string;
  imageSource: ImageSourcePropType;
};

export const ProductPriceHero = ({
  width,
  productName,
  priceText,
  dealTone,
  dealLabel,
  imageSource
}: ProductPriceHeroProps) => {
  return (
    <View style={[styles.heroBlock, { width }]}>
      <View style={styles.productImageWrap}>
        <Image source={imageSource} style={styles.productImage} />
      </View>
      <Text numberOfLines={1} style={styles.productName}>
        {productName}
      </Text>
      <View style={styles.priceWrap}>
        <Text style={styles.priceCurrency}>¥</Text>
        <Text style={styles.priceValue}>{priceText}</Text>
      </View>
      <View style={[styles.dealBadge, dealTone === 'great' ? styles.dealBadgeGreat : styles.dealBadgeStandard]}>
        <View style={[styles.dealDot, dealTone === 'great' ? styles.dealDotGreat : styles.dealDotStandard]} />
        <Text style={[styles.dealLabel, dealTone === 'great' ? styles.dealLabelGreat : styles.dealLabelStandard]}>
          {dealLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroBlock: {
    alignItems: 'center',
    minHeight: 293
  },
  productImageWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    marginTop: 6,
    width: 96
  },
  productImage: {
    borderRadius: 14,
    height: 88,
    width: 88
  },
  productName: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '500',
    lineHeight: 30,
    marginTop: spacing.lg
  },
  priceWrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 2
  },
  priceCurrency: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingMd,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 8
  },
  priceValue: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.2,
    lineHeight: 48
  },
  dealBadge: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 2
  },
  dealBadgeGreat: {
    backgroundColor: '#DCFCE7'
  },
  dealBadgeStandard: {
    backgroundColor: '#E2E8F0'
  },
  dealDot: {
    borderRadius: 999,
    height: 6,
    marginRight: 6,
    width: 6
  },
  dealDotGreat: {
    backgroundColor: '#22C55E'
  },
  dealDotStandard: {
    backgroundColor: '#64748B'
  },
  dealLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16
  },
  dealLabelGreat: {
    color: '#166534'
  },
  dealLabelStandard: {
    color: '#334155'
  }
});
