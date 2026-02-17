import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ProductPriceActionButtons,
  ProductPriceDetailHeader,
  ProductPriceDetailInvalidState,
  ProductPriceHero,
  ProductPriceInformationSection,
  ProductPriceLocationSection,
  ProductPriceNotesSection,
  ProductPriceStatusMessage
} from '../src/components/productPriceDetail';
import { useI18n } from '../src/i18n/useI18n';
import { spacing } from '../src/theme/tokens';
import { openExternalRoute } from '../src/utils/externalMapNavigation';
import { ProductPriceDetailRouteParams } from '../src/utils/productPriceDetail';
import { useProductPriceDetailController } from '../src/features/productPriceDetail/hooks/useProductPriceDetailController';

const TEMP_PRODUCT_IMAGE = require('../public/icons/icon-192.png');

export default function ProductPriceDetailScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width - spacing.md * 2, 390);
  const contentWidth = Math.min(frameWidth - spacing.md * 2, 358);
  const rawParams = useLocalSearchParams<ProductPriceDetailRouteParams>();
  const { parsedParams, detailView, statusMessage, setStatusMessage } = useProductPriceDetailController({
    rawParams,
    language,
    t
  });

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

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ProductPriceDetailHeader
        backLabel={t('back')}
        frameWidth={frameWidth}
        onBack={handleBack}
        onShare={() => setStatusMessage(t('detail_share_pending'))}
        shareLabel={t('detail_share')}
        title={t('detail_title')}
      />

      {!parsedParams || !detailView ? (
        <ProductPriceDetailInvalidState
          body={t('detail_missing_params_body')}
          title={t('detail_missing_params_title')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.mainColumn, { width: frameWidth }]}>
            <ProductPriceHero
              dealLabel={detailView.dealLabel}
              dealTone={detailView.dealTone}
              imageSource={TEMP_PRODUCT_IMAGE}
              priceText={detailView.priceText}
              productName={parsedParams.productName}
              width={contentWidth}
            />

            <ProductPriceInformationSection
              areaLabel={t('detail_area_label')}
              areaValue={parsedParams.cityArea}
              heading={t('detail_information_heading')}
              observedLabel={t('detail_observed_label')}
              observedValue={detailView.observedLabel}
              storeLabel={t('detail_store_label')}
              storeValue={parsedParams.storeName}
              width={contentWidth}
            />

            <ProductPriceLocationSection
              cityArea={parsedParams.cityArea}
              heading={t('detail_location_heading')}
              latitude={parsedParams.latitude}
              longitude={parsedParams.longitude}
              navigateLabel={t('detail_navigate')}
              onNavigate={() => {
                void handleNavigate();
              }}
              storeName={parsedParams.storeName}
              width={contentWidth}
            />

            <ProductPriceNotesSection
              meta={t('detail_meta_empty')}
              notes={t('detail_notes_empty')}
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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F8',
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: spacing.lg
  },
  mainColumn: {
    alignItems: 'center',
    minHeight: '100%'
  }
});
