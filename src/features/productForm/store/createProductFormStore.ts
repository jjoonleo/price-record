import { createStore } from 'zustand/vanilla';
import {
  createProduct,
  getProductById,
  updateProduct
} from '../../../db/repositories/productsRepo';
import {
  captureProductImageWithCamera,
  pickProductImageFromLibrary,
  ProductImageError
} from '../productImage';
import {
  createInitialProductFormState,
  ProductFormMessages,
  ProductFormSubmitResult,
  ProductFormStoreState
} from '../model/productFormModel';
import { ProductFormValues, getProductFormDefaults } from '../schema';

export type ProductFormStoreDependencies = {
  createProduct: typeof createProduct;
  getProductById: typeof getProductById;
  updateProduct: typeof updateProduct;
  pickProductImageFromLibrary: typeof pickProductImageFromLibrary;
  captureProductImageWithCamera: typeof captureProductImageWithCamera;
};

const defaultDependencies: ProductFormStoreDependencies = {
  createProduct,
  getProductById,
  updateProduct,
  pickProductImageFromLibrary,
  captureProductImageWithCamera
};

const toImageErrorMessage = (error: unknown, messages: ProductFormMessages): string => {
  if (error instanceof ProductImageError) {
    if (error.code === 'permission_denied') {
      return messages.imagePermissionDenied;
    }

    if (error.code === 'too_large') {
      return messages.imageTooLarge;
    }

    return messages.imageProcessingFailed;
  }

  return error instanceof Error ? error.message : messages.imageProcessingFailed;
};

export type ProductFormStoreApi = ReturnType<typeof createProductFormStore>;

export const createProductFormStore = (
  dependencies: ProductFormStoreDependencies = defaultDependencies
) => {
  return createStore<ProductFormStoreState>()((set, get) => ({
    ...createInitialProductFormState(),

    setInitialValues: (values) => {
      set({ initialValues: values });
    },

    setImageUri: (uri) => {
      set({ imageUri: uri.trim() });
    },

    setStatusMessage: (message) => {
      set({ statusMessage: message });
    },

    setIsLoadingProduct: (isLoadingProduct) => {
      set({ isLoadingProduct });
    },

    setIsSubmitting: (isSubmitting) => {
      set({ isSubmitting });
    },

    resetForCreate: () => {
      set({
        initialValues: getProductFormDefaults(),
        isLoadingProduct: false,
        isSubmitting: false,
        imageUri: '',
        statusMessage: null
      });
    },

    hydrateForEdit: async (productId: string | null, messages: ProductFormMessages) => {
      if (!productId) {
        set({
          statusMessage: messages.notFound,
          imageUri: '',
          isLoadingProduct: false
        });
        return;
      }

      set({
        isLoadingProduct: true,
        statusMessage: null
      });

      try {
        const product = await dependencies.getProductById(productId);
        if (!product) {
          set({
            statusMessage: messages.notFound,
            imageUri: '',
            isLoadingProduct: false
          });
          return;
        }

        set({
          initialValues: {
            name: product.name,
            note: product.note
          },
          imageUri: product.imageUri,
          isLoadingProduct: false
        });
      } catch (error) {
        set({
          statusMessage: error instanceof Error ? error.message : messages.saveError,
          isLoadingProduct: false
        });
      }
    },

    runImageSelection: async (
      picker: () => Promise<string | null>,
      messages: ProductFormMessages
    ) => {
      const state = get();
      if (state.isLoadingProduct || state.isSubmitting) {
        return;
      }

      try {
        const nextImageUri = await picker();
        if (!nextImageUri) {
          return;
        }

        set({
          imageUri: nextImageUri.trim(),
          statusMessage: messages.imageSelected
        });
      } catch (error) {
        set({ statusMessage: toImageErrorMessage(error, messages) });
      }
    },

    pickImageFromLibrary: async (messages: ProductFormMessages) => {
      const run = get().runImageSelection;
      await run(() => dependencies.pickProductImageFromLibrary(), messages);
    },

    takePhoto: async (messages: ProductFormMessages) => {
      const run = get().runImageSelection;
      await run(() => dependencies.captureProductImageWithCamera(), messages);
    },

    removeImage: (messages: ProductFormMessages) => {
      if (!get().imageUri.trim()) {
        return;
      }

      set({
        imageUri: '',
        statusMessage: messages.imageRemoved
      });
    },

    submitForm: async ({
      isEditMode,
      productId,
      values,
      messages
    }: {
      isEditMode: boolean;
      productId: string | null;
      values: ProductFormValues;
      messages: ProductFormMessages;
    }): Promise<ProductFormSubmitResult> => {
      set({
        isSubmitting: true,
        statusMessage: null
      });

      try {
        if (isEditMode) {
          if (!productId) {
            set({
              statusMessage: messages.notFound,
              isSubmitting: false
            });
            return { ok: false };
          }

          const product = await dependencies.updateProduct({
            id: productId,
            name: values.name,
            note: values.note,
            imageUri: get().imageUri
          });

          set({
            statusMessage: messages.updatedStatus,
            isSubmitting: false
          });
          return { ok: true, productId: product.id, mode: 'edit' };
        }

        const product = await dependencies.createProduct({
          name: values.name,
          note: values.note,
          imageUri: get().imageUri
        });

        set({
          statusMessage: messages.createdStatus,
          isSubmitting: false
        });
        return { ok: true, productId: product.id, mode: 'create' };
      } catch (error) {
        set({
          statusMessage: error instanceof Error ? error.message : messages.saveError,
          isSubmitting: false
        });
        return { ok: false };
      }
    }
  }));
};
