import { ImageSourcePropType } from 'react-native';

export const PRODUCT_PLACEHOLDER_IMAGE = require('../assets/compare-placeholder.png');

export const resolveProductImageSource = (
  imageUri?: string | null
): ImageSourcePropType => {
  if (!imageUri) {
    return PRODUCT_PLACEHOLDER_IMAGE;
  }

  const trimmed = imageUri.trim();
  if (!trimmed) {
    return PRODUCT_PLACEHOLDER_IMAGE;
  }

  return { uri: trimmed };
};
