import { useCallback, useRef, useState } from 'react';

export const usePlacePickerSearchUiState = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keepSuggestionPanelVisible, setKeepSuggestionPanelVisible] = useState(false);
  const suppressSearchBlurRef = useRef(false);

  const handleSearchBlur = useCallback(() => {
    if (suppressSearchBlurRef.current) {
      suppressSearchBlurRef.current = false;
      return;
    }

    setIsSearchFocused(false);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    setKeepSuggestionPanelVisible(false);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    setKeepSuggestionPanelVisible(true);
  }, []);

  const handleSearchClear = useCallback(() => {
    setKeepSuggestionPanelVisible(false);
  }, []);

  const handleSuggestionPressIn = useCallback(() => {
    suppressSearchBlurRef.current = true;
  }, []);

  const hideSearchUi = useCallback(() => {
    suppressSearchBlurRef.current = false;
    setKeepSuggestionPanelVisible(false);
    setIsSearchFocused(false);
  }, []);

  const resetSearchUiForSession = useCallback(() => {
    suppressSearchBlurRef.current = false;
    setIsSearchFocused(false);
    setKeepSuggestionPanelVisible(false);
  }, []);

  return {
    handleSearchBlur,
    handleSearchClear,
    handleSearchFocus,
    handleSearchSubmit,
    handleSuggestionPressIn,
    hideSearchUi,
    isSearchFocused,
    keepSuggestionPanelVisible,
    resetSearchUiForSession,
    setKeepSuggestionPanelVisible
  };
};
