export const shouldApplySuggestedStoreName = (params: {
  currentStoreName: string;
  storeNameTouched: boolean;
  lastAutoFilledStoreName: string | null;
}): boolean => {
  const { currentStoreName, storeNameTouched, lastAutoFilledStoreName } = params;
  const trimmed = currentStoreName.trim();

  return !storeNameTouched || !trimmed || trimmed === (lastAutoFilledStoreName ?? '');
};
