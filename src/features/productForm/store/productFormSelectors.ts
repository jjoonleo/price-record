import { ProductFormStoreState } from '../model/productFormModel';

export const productFormSelectors = {
  initialValues: (state: ProductFormStoreState) => state.initialValues,
  isLoadingProduct: (state: ProductFormStoreState) => state.isLoadingProduct,
  isSubmitting: (state: ProductFormStoreState) => state.isSubmitting,
  imageUri: (state: ProductFormStoreState) => state.imageUri,
  statusMessage: (state: ProductFormStoreState) => state.statusMessage,
  setInitialValues: (state: ProductFormStoreState) => state.setInitialValues,
  setImageUri: (state: ProductFormStoreState) => state.setImageUri,
  setStatusMessage: (state: ProductFormStoreState) => state.setStatusMessage,
  setIsLoadingProduct: (state: ProductFormStoreState) => state.setIsLoadingProduct,
  setIsSubmitting: (state: ProductFormStoreState) => state.setIsSubmitting,
  resetForCreate: (state: ProductFormStoreState) => state.resetForCreate,
  hydrateForEdit: (state: ProductFormStoreState) => state.hydrateForEdit,
  runImageSelection: (state: ProductFormStoreState) => state.runImageSelection,
  pickImageFromLibrary: (state: ProductFormStoreState) => state.pickImageFromLibrary,
  takePhoto: (state: ProductFormStoreState) => state.takePhoto,
  removeImage: (state: ProductFormStoreState) => state.removeImage,
  submitForm: (state: ProductFormStoreState) => state.submitForm
};
