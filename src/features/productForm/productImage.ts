import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export const PRODUCT_IMAGE_MAX_DIMENSION = 512;
export const PRODUCT_IMAGE_QUALITY = 0.7;
export const MAX_PRODUCT_IMAGE_DATA_URI_CHARS = 450_000;

export type ProductImageErrorCode = 'permission_denied' | 'processing_failed' | 'too_large';

export class ProductImageError extends Error {
  code: ProductImageErrorCode;

  constructor(code: ProductImageErrorCode) {
    super(code);
    this.name = 'ProductImageError';
    this.code = code;
  }
}

const toResizeAction = (width: number, height: number): ImageManipulator.Action => {
  if (width >= height) {
    return { resize: { width: PRODUCT_IMAGE_MAX_DIMENSION } };
  }

  return { resize: { height: PRODUCT_IMAGE_MAX_DIMENSION } };
};

const toDataUri = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
  if (!asset.uri) {
    throw new ProductImageError('processing_failed');
  }

  const width = asset.width ?? PRODUCT_IMAGE_MAX_DIMENSION;
  const height = asset.height ?? PRODUCT_IMAGE_MAX_DIMENSION;
  const resizeAction = toResizeAction(width, height);

  const result = await ImageManipulator.manipulateAsync(asset.uri, [resizeAction], {
    compress: PRODUCT_IMAGE_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true
  });

  if (!result.base64) {
    throw new ProductImageError('processing_failed');
  }

  const dataUri = `data:image/jpeg;base64,${result.base64}`;
  if (dataUri.length > MAX_PRODUCT_IMAGE_DATA_URI_CHARS) {
    throw new ProductImageError('too_large');
  }

  return dataUri;
};

const processPickerResult = async (result: ImagePicker.ImagePickerResult): Promise<string | null> => {
  if (result.canceled) {
    return null;
  }

  const firstAsset = result.assets[0];
  if (!firstAsset) {
    throw new ProductImageError('processing_failed');
  }

  try {
    return await toDataUri(firstAsset);
  } catch (error) {
    if (error instanceof ProductImageError) {
      throw error;
    }
    throw new ProductImageError('processing_failed');
  }
};

export const pickProductImageFromLibrary = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new ProductImageError('permission_denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1
  });

  return processPickerResult(result);
};

export const captureProductImageWithCamera = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new ProductImageError('permission_denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 1
  });

  return processPickerResult(result);
};
