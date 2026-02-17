import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { getProductById } from '../src/db/repositories/productsRepo';
import { deletePriceEntry } from '../src/db/repositories/priceEntriesRepo';
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
import { resolveProductImageSource } from '../src/utils/productImage';
import { ProductPriceDetailRouteParams } from '../src/utils/productPriceDetail';
const toParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

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
  const [productImageUri, setProductImageUri] = useState('');

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

  useEffect(() => {
    if (!parsedParams) {
      setProductImageUri('');
      return;
    }

    let didCancel = false;

    void (async () => {
      try {
        const product = await getProductById(parsedParams.productId);
        if (didCancel) {
          return;
        }

        setProductImageUri(product?.imageUri ?? '');
      } catch {
        if (didCancel) {
          return;
        }
        setProductImageUri('');
      }
    })();

    return () => {
      didCancel = true;
    };
  }, [parsedParams]);

  const handleBack = () => {
    router.navigate('/compare');
  };

  const handleEdit = () => {
    if (!parsedParams) {
      setStatusMessage(t('detail_edit_pending'));
      return;
    }

    router.navigate({
      pathname: '/capture',
      params: {
        mode: 'edit',
        entryId: parsedParams.priceEntryId
      }
    });
  };

  const requestDeleteConfirmation = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return Promise.resolve(window.confirm(`${t('detail_delete_entry')}\n\n${t('detail_delete_confirm_body')}`));
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert(
        t('detail_delete_entry'),
        t('detail_delete_confirm_body'),
        [
          { text: t('cancel'), onPress: () => resolve(false), style: 'cancel' },
          {
            text: t('detail_delete_entry'),
            style: 'destructive',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  };

  const handleDelete = async () => {
    const fallbackEntryId = toParamValue(rawParams.entryId) ?? toParamValue(rawParams.priceEntryId);
    if (!parsedParams || !parsedParams.priceEntryId) {
      if (fallbackEntryId) {
        const shouldDelete = await requestDeleteConfirmation();

        if (!shouldDelete) {
          return;
        }

        try {
          await deletePriceEntry(fallbackEntryId);
          router.navigate('/compare');
        } catch (error) {
          setStatusMessage(error instanceof Error ? error.message : t('save_error'));
        }
        return;
      }

      setStatusMessage(t('detail_delete_pending'));
      return;
    }

    const shouldDelete = await requestDeleteConfirmation();
    if (!shouldDelete) {
      return;
    }

    try {
      await deletePriceEntry(parsedParams.priceEntryId);
      router.navigate('/compare');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('save_error'));
    }
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
          <View style={[styles.mapHeroWrap, { width: frameWidth }]}>
            <ProductPriceMapHero
              isFavorite={isFavorite}
              latitude={parsedParams.latitude}
              longitude={parsedParams.longitude}
              onBack={handleBack}
              onFavorite={() => setIsFavorite((current) => !current)}
              onShare={() => setStatusMessage(t('detail_share_pending'))}
              width={frameWidth}
            />
          </View>

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
              imageSource={resolveProductImageSource(productImageUri)}
              observedLabel={compactObservedLabel}
              priceLabel={`¥${detailView.priceText}`}
              productName={parsedParams.productName}
              width={contentWidth}
            />

            <ProductPriceActionButtons
              deleteLabel={t('detail_delete_entry')}
              editLabel={t('detail_edit_entry')}
              onDelete={handleDelete}
              onEdit={handleEdit}
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
  mapHeroWrap: {
    position: 'relative'
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
