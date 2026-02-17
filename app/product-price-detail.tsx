import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ProductPriceActionButtons,
  ProductPriceDetailInvalidState,
  ProductPriceEntryCard,
  ProductPriceMapHero,
  ProductPriceStatusMessage,
  ProductPriceStoreSummaryCard
} from '../src/components/productPriceDetail';
import { useProductPriceDetailController } from '../src/features/productPriceDetail/hooks/useProductPriceDetailController';
import { useI18n } from '../src/i18n/useI18n';
import { spacing } from '../src/theme/tokens';
import { openExternalRoute } from '../src/utils/externalMapNavigation';
import { ProductPriceDetailRouteParams } from '../src/utils/productPriceDetail';

const PRODUCT_FALLBACK_IMAGE = require('../public/images/product-price-detail/product-default.png');

const formatCompactObservedAt = (observedAt: string, locale: string): string => {
  const date = new Date(observedAt);
  if (Number.isNaN(date.getTime())) {
    return observedAt;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export default function ProductPriceDetailScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width - spacing.md * 2, 390);
  const contentWidth = frameWidth - spacing.md * 2;
  const [isFavorite, setIsFavorite] = useState(false);

  const rawParams = useLocalSearchParams<ProductPriceDetailRouteParams>();
  const { parsedParams, detailView, statusMessage, setStatusMessage } = useProductPriceDetailController({
    rawParams,
    language,
    t
  });

  const compactObservedLabel = useMemo(() => {
    if (!parsedParams) {
      return '';
    }

    return formatCompactObservedAt(parsedParams.observedAt, locale);
  }, [locale, parsedParams]);

  const handleBack = () => {
    router.navigate('/compare');
  };

  const handleNavigate = async () => {
    if (!parsedParams) {
      setStatusMessage(t('navigation_open_failed'));
      return;
    }

    const didOpen = await openExternalRoute({
      latitude: parsedParams.latitude,
      longitude: parsedParams.longitude,
      label: parsedParams.storeName,
      mode: 'transit'
    });

    if (!didOpen) {
      setStatusMessage(t('navigation_open_failed'));
    }
  };

  if (!parsedParams || !detailView) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ProductPriceDetailInvalidState
          body={t('detail_missing_params_body')}
          title={t('detail_missing_params_title')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainColumn, { width: frameWidth }]}>
          <ProductPriceMapHero
            isFavorite={isFavorite}
            latitude={parsedParams.latitude}
            longitude={parsedParams.longitude}
            onBack={handleBack}
            onFavorite={() => setIsFavorite((current) => !current)}
            onShare={() => setStatusMessage(t('detail_share_pending'))}
            width={frameWidth}
          />

          <View style={[styles.sheet, { width: frameWidth }]}>
            <ProductPriceStoreSummaryCard
              addressLine={parsedParams.addressLine}
              cityArea={parsedParams.cityArea}
              directionsLabel={t('detail_navigate')}
              onDirections={() => {
                void handleNavigate();
              }}
              storeName={parsedParams.storeName}
              width={contentWidth}
            />

            <ProductPriceEntryCard
              imageSource={PRODUCT_FALLBACK_IMAGE}
              observedLabel={compactObservedLabel}
              priceLabel={`¥${detailView.priceText}`}
              productName={parsedParams.productName}
              width={contentWidth}
            />

            <ProductPriceActionButtons
              deleteLabel={t('detail_delete_entry')}
              editLabel={t('detail_edit_entry')}
              onDelete={() => setStatusMessage(t('detail_delete_pending'))}
              onEdit={() => setStatusMessage(t('detail_edit_pending'))}
              width={contentWidth}
            />

            {statusMessage ? <ProductPriceStatusMessage message={statusMessage} /> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F2F2F7',
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 48
  },
  mainColumn: {
    alignItems: 'center',
    minHeight: '100%'
  },
  sheet: {
    alignItems: 'center',
    gap: 16,
    marginTop: -32,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    width: '100%'
  }
});
