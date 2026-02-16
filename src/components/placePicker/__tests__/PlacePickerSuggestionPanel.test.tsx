import { ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PlacePickerSuggestionPanel } from '../PlacePickerSuggestionPanel';

const renderWithAct = (element: ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
};

describe('PlacePickerSuggestionPanel', () => {
  it('renders loading state', () => {
    const tree = renderWithAct(
      <PlacePickerSuggestionPanel
        applyingLabel="Applying"
        isLoading
        isVisible
        loadingLabel="Searching"
        onSuggestionPress={() => {}}
        onSuggestionPressIn={() => {}}
        selectedSuggestionId={null}
        suggestions={[]}
      />
    );

    try {
      expect(tree.root.findByProps({ children: 'Searching' })).toBeTruthy();
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });

  it('renders suggestions and selected applying status', () => {
    const tree = renderWithAct(
      <PlacePickerSuggestionPanel
        applyingLabel="Applying"
        isLoading={false}
        isVisible
        loadingLabel="Searching"
        onSuggestionPress={() => {}}
        onSuggestionPressIn={() => {}}
        selectedSuggestionId="place-2"
        suggestions={[
          { placeId: 'place-1', primaryText: 'Store One' },
          { placeId: 'place-2', primaryText: 'Store Two', secondaryText: 'Shibuya' }
        ]}
      />
    );

    try {
      expect(tree.root.findByProps({ children: 'Store One' })).toBeTruthy();
      expect(tree.root.findByProps({ children: 'Store Two' })).toBeTruthy();
      expect(tree.root.findByProps({ children: 'Shibuya' })).toBeTruthy();
      expect(tree.root.findByProps({ children: 'Applying' })).toBeTruthy();
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
