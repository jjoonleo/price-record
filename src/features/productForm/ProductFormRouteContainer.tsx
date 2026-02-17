import { ProductFormScreen } from './ProductFormScreen';
import { useProductFormController } from './hooks/useProductFormController';

export const ProductFormRouteContainer = () => {
  const controller = useProductFormController();

  return (
    <ProductFormScreen
      isSaving={controller.isSubmitting}
      isLoading={controller.isLoadingProduct}
      backLabel={controller.labels.backLabel}
      headerTitle={controller.formTitle}
      imageLabel={controller.labels.imageLabel}
      imagePickLibraryLabel={controller.labels.imagePickLibraryLabel}
      imageTakePhotoLabel={controller.labels.imageTakePhotoLabel}
      imageRemoveLabel={controller.labels.imageRemoveLabel}
      nameLabel={controller.labels.nameLabel}
      noteLabel={controller.labels.noteLabel}
      namePlaceholder={controller.labels.namePlaceholder}
      notePlaceholder={controller.labels.notePlaceholder}
      submitLabel={controller.submitLabel}
      imageUri={controller.imageUri}
      initialValues={controller.initialValues}
      statusMessage={controller.statusMessage}
      onSubmit={controller.onSubmit}
      onCancel={controller.onCancel}
      onPickImageFromLibrary={controller.onPickImageFromLibrary}
      onTakePhoto={controller.onTakePhoto}
      onRemoveImage={controller.onRemoveImage}
      saveNameRequiredMessage={controller.labels.saveNameRequiredMessage}
      saveNoteTooLongMessage={controller.labels.saveNoteTooLongMessage}
    />
  );
};
