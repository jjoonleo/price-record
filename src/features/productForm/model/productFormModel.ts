import { ProductFormValues, getProductFormDefaults } from '../schema';

export type ProductFormMessages = {
  notFound: string;
  saveError: string;
  imageSelected: string;
  imageRemoved: string;
  imagePermissionDenied: string;
  imageTooLarge: string;
  imageProcessingFailed: string;
  createdStatus: string;
  updatedStatus: string;
};

export type ProductFormFeatureState = {
  initialValues: ProductFormValues;
  isLoadingProduct: boolean;
  isSubmitting: boolean;
  imageUri: string;
  statusMessage: string | null;
};

export type ProductFormSubmitResult =
  | { ok: true; productId: string; mode: 'create' | 'edit' }
  | { ok: false };

export type ProductFormFeatureActions = {
  setInitialValues: (values: ProductFormValues) => void;
  setImageUri: (uri: string) => void;
  setStatusMessage: (message: string | null) => void;
  setIsLoadingProduct: (isLoading: boolean) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetForCreate: () => void;
  hydrateForEdit: (productId: string | null, messages: ProductFormMessages) => Promise<void>;
  runImageSelection: (
    picker: () => Promise<string | null>,
    messages: ProductFormMessages
  ) => Promise<void>;
  pickImageFromLibrary: (messages: ProductFormMessages) => Promise<void>;
  takePhoto: (messages: ProductFormMessages) => Promise<void>;
  removeImage: (messages: ProductFormMessages) => void;
  submitForm: (input: {
    isEditMode: boolean;
    productId: string | null;
    values: ProductFormValues;
    messages: ProductFormMessages;
  }) => Promise<ProductFormSubmitResult>;
};

export type ProductFormStoreState = ProductFormFeatureState & ProductFormFeatureActions;

export const createInitialProductFormState = (): ProductFormFeatureState => ({
  initialValues: getProductFormDefaults(),
  isLoadingProduct: false,
  isSubmitting: false,
  imageUri: '',
  statusMessage: null
});
