import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  captureProductImageWithCamera,
  MAX_PRODUCT_IMAGE_DATA_URI_CHARS,
  pickProductImageFromLibrary
} from '../productImage';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images'
  }
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg'
  }
}));

const mockAsset = {
  uri: 'file:///tmp/product.png',
  width: 1200,
  height: 800
};

describe('productImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted'
    });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset]
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [mockAsset]
    });
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: 'file:///tmp/product-optimized.jpg',
      base64: 'abc123',
      width: 512,
      height: 341
    });
  });

  test('returns processed data URI from library picker', async () => {
    const imageUri = await pickProductImageFromLibrary();
    expect(imageUri).toBe('data:image/jpeg;base64,abc123');
  });

  test('returns processed data URI from camera picker', async () => {
    const imageUri = await captureProductImageWithCamera();
    expect(imageUri).toBe('data:image/jpeg;base64,abc123');
  });

  test('returns null when user cancels picker', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: null
    });

    const imageUri = await pickProductImageFromLibrary();
    expect(imageUri).toBeNull();
  });

  test('throws permission error when library permission is denied', async () => {
    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied'
    });

    await expect(pickProductImageFromLibrary()).rejects.toMatchObject({
      code: 'permission_denied'
    });
  });

  test('throws size error when processed data URI is too large', async () => {
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: 'file:///tmp/product-optimized.jpg',
      base64: 'a'.repeat(MAX_PRODUCT_IMAGE_DATA_URI_CHARS),
      width: 512,
      height: 341
    });

    await expect(pickProductImageFromLibrary()).rejects.toMatchObject({
      code: 'too_large'
    });
  });

  test('throws processing error when manipulator fails unexpectedly', async () => {
    (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(pickProductImageFromLibrary()).rejects.toMatchObject({
      code: 'processing_failed'
    });
  });
});
