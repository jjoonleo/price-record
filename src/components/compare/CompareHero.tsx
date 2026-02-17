import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { colors, spacing, typography } from '../../theme/tokens';

type CompareHeroProps = {
  imageSource: ImageSourcePropType;
  productName: string;
  productSubtitle?: string | null;
};

export const CompareHero = ({ imageSource, productName, productSubtitle }: CompareHeroProps) => {
  return (
    <View style={styles.heroSection}>
      <AppCard padded={false} style={styles.productImageCard}>
        <Image source={imageSource} style={styles.productImage} />
      </AppCard>
      <Text numberOfLines={2} style={styles.productName}>
        {productName}
      </Text>
      {productSubtitle ? <Text style={styles.productSubtitle}>{productSubtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 24
  },
  productImageCard: {
    alignItems: 'center',
    borderRadius: 16,
    height: 104,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 104
  },
  productImage: {
    borderRadius: 8,
    height: 76,
    width: 76
  },
  productName: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 4,
    textAlign: 'center'
  },
  productSubtitle: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22.5,
    textAlign: 'center'
  }
});
