import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { createProduct, getProductById, updateProduct } from '../src/db/repositories/productsRepo';
import { ProductFormScreen } from '../src/features/productForm/ProductFormScreen';
import {
  getProductFormDefaults,
  ProductFormValues
} from '../src/features/productForm/schema';
import { useI18n } from '../src/i18n/useI18n';

type QueryParams = {
  mode?: string;
  productId?: string;
  returnRoute?: string;
  returnMode?: 'edit' | 'create';
  returnEntryId?: string;
};

const toParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

export default function ProductFormRoute() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<QueryParams>();

  const routeMode = toParamValue(params.mode);
  const productId = toParamValue(params.productId);
  const returnRoute = toParamValue(params.returnRoute) ?? '/compare';
  const returnMode = toParamValue(params.returnMode);
  const returnEntryId = toParamValue(params.returnEntryId);
  const isEditMode = routeMode === 'edit' && Boolean(productId);

  const [initialValues, setInitialValues] = useState<ProductFormValues>(getProductFormDefaults());
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode) {
      setInitialValues(getProductFormDefaults());
      setIsLoadingProduct(false);
      return;
    }

    let didCancel = false;
    setIsLoadingProduct(true);
    setStatusMessage(null);

    void (async () => {
      const product = await getProductById(productId);
      if (didCancel) {
        return;
      }

      if (!product) {
        setStatusMessage(t('product_form_not_found'));
        setIsLoadingProduct(false);
        return;
      }

      setInitialValues({
        name: product.name,
        note: product.note
      });
      setIsLoadingProduct(false);
    })();

    return () => {
      didCancel = true;
    };
  }, [isEditMode, productId, t]);

  const returnToCaller = useCallback(
    (savedProductId: string) => {
      const nextRoute = returnRoute === '/capture' ? '/capture' : '/compare';
      const paramsToReturn: Record<string, string> = {};

      if (nextRoute === '/capture') {
        paramsToReturn.selectedProductId = savedProductId;

        if (returnMode === 'edit' && returnEntryId) {
          paramsToReturn.mode = 'edit';
          paramsToReturn.entryId = returnEntryId;
        } else if (returnMode === 'create') {
          paramsToReturn.mode = 'create';
        }
      }

      router.navigate({
        pathname: nextRoute,
        params: paramsToReturn
      });
    },
    [returnEntryId, returnMode, returnRoute, router]
  );

  const submitForm = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const product = isEditMode
        ? await updateProduct({
            id: productId ?? '',
            name: values.name,
            note: values.note
          })
        : await createProduct({
            name: values.name,
            note: values.note
          });

      setStatusMessage(
        isEditMode ? t('product_form_updated_status') : t('product_form_created_status')
      );

      Alert.alert(
        isEditMode ? t('product_form_updated_title') : t('product_form_created_title'),
        isEditMode ? t('product_form_updated_body') : t('product_form_created_body')
      );

      returnToCaller(product.id);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('save_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formTitle = useMemo(
    () => (isEditMode ? t('product_form_title_edit') : t('product_form_title_create')),
    [isEditMode, t]
  );

  const submitLabel = useMemo(
    () => (isEditMode ? t('product_form_update') : t('product_form_create')),
    [isEditMode, t]
  );

  return (
    <ProductFormScreen
      isSaving={isSubmitting}
      isLoading={isLoadingProduct}
      backLabel={t('back')}
      headerTitle={formTitle}
      nameLabel={t('product_form_name_label')}
      noteLabel={t('product_form_note_label')}
      namePlaceholder={t('product_form_name_placeholder')}
      notePlaceholder={t('product_form_note_placeholder')}
      submitLabel={submitLabel}
      initialValues={initialValues}
      statusMessage={statusMessage}
      onSubmit={submitForm}
      onCancel={() => {
        router.back();
      }}
      saveNameRequiredMessage={t('product_form_name_required')}
      saveNoteTooLongMessage={t('product_form_note_too_long')}
    />
  );
}
