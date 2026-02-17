import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { shallow } from 'zustand/shallow';
import { useI18n } from '../../../i18n/useI18n';
import { ProductFormValues } from '../schema';
import { productFormSelectors } from '../store/productFormSelectors';
import { useProductFormStoreWithEquality } from '../store/productFormStoreContext';

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

export const useProductFormController = () => {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<QueryParams>();

  const {
    initialValues,
    isLoadingProduct,
    isSubmitting,
    imageUri,
    statusMessage,
    resetForCreate,
    hydrateForEdit,
    pickImageFromLibrary,
    takePhoto,
    removeImage,
    submitForm
  } = useProductFormStoreWithEquality(
    (state) => ({
      initialValues: productFormSelectors.initialValues(state),
      isLoadingProduct: productFormSelectors.isLoadingProduct(state),
      isSubmitting: productFormSelectors.isSubmitting(state),
      imageUri: productFormSelectors.imageUri(state),
      statusMessage: productFormSelectors.statusMessage(state),
      resetForCreate: productFormSelectors.resetForCreate(state),
      hydrateForEdit: productFormSelectors.hydrateForEdit(state),
      pickImageFromLibrary: productFormSelectors.pickImageFromLibrary(state),
      takePhoto: productFormSelectors.takePhoto(state),
      removeImage: productFormSelectors.removeImage(state),
      submitForm: productFormSelectors.submitForm(state)
    }),
    shallow
  );

  const routeMode = toParamValue(params.mode);
  const productId = toParamValue(params.productId);
  const returnRoute = toParamValue(params.returnRoute) ?? '/compare';
  const returnMode = toParamValue(params.returnMode);
  const returnEntryId = toParamValue(params.returnEntryId);
  const isEditMode = routeMode === 'edit' && Boolean(productId);

  const messages = useMemo(
    () => ({
      notFound: t('product_form_not_found'),
      saveError: t('save_error'),
      imageSelected: t('product_form_image_selected_status'),
      imageRemoved: t('product_form_image_removed_status'),
      imagePermissionDenied: t('product_form_image_permission_denied'),
      imageTooLarge: t('product_form_image_too_large'),
      imageProcessingFailed: t('product_form_image_processing_failed'),
      createdStatus: t('product_form_created_status'),
      updatedStatus: t('product_form_updated_status')
    }),
    [t]
  );

  useEffect(() => {
    if (!isEditMode) {
      resetForCreate();
      return;
    }

    void hydrateForEdit(productId, messages);
  }, [hydrateForEdit, isEditMode, messages, productId, resetForCreate]);

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

  const onSubmit = useCallback(
    async (values: ProductFormValues) => {
      const result = await submitForm({
        isEditMode,
        productId,
        values,
        messages
      });

      if (!result.ok) {
        return;
      }

      Alert.alert(
        result.mode === 'edit' ? t('product_form_updated_title') : t('product_form_created_title'),
        result.mode === 'edit' ? t('product_form_updated_body') : t('product_form_created_body')
      );

      returnToCaller(result.productId);
    },
    [isEditMode, messages, productId, returnToCaller, submitForm, t]
  );

  const onPickImageFromLibrary = useCallback(() => {
    void pickImageFromLibrary(messages);
  }, [messages, pickImageFromLibrary]);

  const onTakePhoto = useCallback(() => {
    void takePhoto(messages);
  }, [messages, takePhoto]);

  const onRemoveImage = useCallback(() => {
    removeImage(messages);
  }, [messages, removeImage]);

  const formTitle = useMemo(
    () => (isEditMode ? t('product_form_title_edit') : t('product_form_title_create')),
    [isEditMode, t]
  );

  const submitLabel = useMemo(
    () => (isEditMode ? t('product_form_update') : t('product_form_create')),
    [isEditMode, t]
  );

  return {
    isLoadingProduct,
    isSubmitting,
    imageUri,
    statusMessage,
    initialValues,
    formTitle,
    submitLabel,
    onSubmit,
    onCancel: () => {
      router.back();
    },
    onPickImageFromLibrary,
    onTakePhoto,
    onRemoveImage,
    labels: {
      backLabel: t('back'),
      imageLabel: t('product_form_image_label'),
      imagePickLibraryLabel: t('product_form_image_pick_library'),
      imageTakePhotoLabel: t('product_form_image_take_photo'),
      imageRemoveLabel: t('product_form_image_remove'),
      nameLabel: t('product_form_name_label'),
      noteLabel: t('product_form_note_label'),
      namePlaceholder: t('product_form_name_placeholder'),
      notePlaceholder: t('product_form_note_placeholder'),
      saveNameRequiredMessage: t('product_form_name_required'),
      saveNoteTooLongMessage: t('product_form_note_too_long')
    }
  };
};
