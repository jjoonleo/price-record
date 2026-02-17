import { ProductImageError } from '../../productImage';
import { createProductFormStore } from '../createProductFormStore';

const messages = {
  notFound: 'not found',
  saveError: 'save error',
  imageSelected: 'image selected',
  imageRemoved: 'image removed',
  imagePermissionDenied: 'permission denied',
  imageTooLarge: 'too large',
  imageProcessingFailed: 'processing failed',
  createdStatus: 'created',
  updatedStatus: 'updated'
};

describe('createProductFormStore', () => {
  it('hydrates existing product in edit mode', async () => {
    const store = createProductFormStore({
      createProduct: jest.fn(),
      getProductById: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Matcha',
        normalizedName: 'matcha',
        note: 'seasonal',
        imageUri: 'data:image/jpeg;base64,ABC',
        createdAt: '2026-02-17T00:00:00.000Z'
      }),
      updateProduct: jest.fn(),
      pickProductImageFromLibrary: jest.fn(),
      captureProductImageWithCamera: jest.fn()
    });

    await store.getState().hydrateForEdit('product-1', messages);

    const state = store.getState();
    expect(state.initialValues).toEqual({ name: 'Matcha', note: 'seasonal' });
    expect(state.imageUri).toBe('data:image/jpeg;base64,ABC');
    expect(state.isLoadingProduct).toBe(false);
  });

  it('maps image picker permission error to translated message', async () => {
    const store = createProductFormStore({
      createProduct: jest.fn(),
      getProductById: jest.fn(),
      updateProduct: jest.fn(),
      pickProductImageFromLibrary: jest
        .fn()
        .mockRejectedValue(new ProductImageError('permission_denied')),
      captureProductImageWithCamera: jest.fn()
    });

    await store.getState().pickImageFromLibrary(messages);

    expect(store.getState().statusMessage).toBe(messages.imagePermissionDenied);
  });

  it('removes image and sets status', () => {
    const store = createProductFormStore({
      createProduct: jest.fn(),
      getProductById: jest.fn(),
      updateProduct: jest.fn(),
      pickProductImageFromLibrary: jest.fn(),
      captureProductImageWithCamera: jest.fn()
    });

    store.getState().setImageUri('data:image/jpeg;base64,ABC');
    store.getState().removeImage(messages);

    expect(store.getState().imageUri).toBe('');
    expect(store.getState().statusMessage).toBe(messages.imageRemoved);
  });

  it('submits create flow and sets created status', async () => {
    const createProductMock = jest.fn().mockResolvedValue({
      id: 'product-1',
      name: 'Matcha',
      normalizedName: 'matcha',
      note: '',
      imageUri: 'data:image/jpeg;base64,ABC',
      createdAt: '2026-02-17T00:00:00.000Z'
    });

    const store = createProductFormStore({
      createProduct: createProductMock,
      getProductById: jest.fn(),
      updateProduct: jest.fn(),
      pickProductImageFromLibrary: jest.fn(),
      captureProductImageWithCamera: jest.fn()
    });

    store.getState().setImageUri('data:image/jpeg;base64,ABC');

    const result = await store.getState().submitForm({
      isEditMode: false,
      productId: null,
      values: { name: 'Matcha', note: '' },
      messages
    });

    expect(result).toEqual({ ok: true, productId: 'product-1', mode: 'create' });
    expect(createProductMock).toHaveBeenCalledWith({
      name: 'Matcha',
      note: '',
      imageUri: 'data:image/jpeg;base64,ABC'
    });
    expect(store.getState().statusMessage).toBe(messages.createdStatus);
    expect(store.getState().isSubmitting).toBe(false);
  });
});
