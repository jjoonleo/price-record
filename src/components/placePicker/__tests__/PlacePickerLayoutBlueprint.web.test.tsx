import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import {
  PLACE_PICKER_LAYOUT_BLUEPRINT_HTML,
  PlacePickerLayoutBlueprint
} from '../PlacePickerLayoutBlueprint.web';

describe('PlacePickerLayoutBlueprint', () => {
  it('exposes semantic anatomy slots for at-a-glance layout reading', () => {
    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<PlacePickerLayoutBlueprint />);
    });

    try {
      const renderedLines = tree!.root.findAllByType(Text).map((lineNode) => String(lineNode.props.children));
      const renderedBlueprint = renderedLines.join('\n');

      expect(renderedBlueprint).toContain('<main data-screen="place-picker-modal">');
      expect(renderedBlueprint).toContain('<section data-slot="map-surface">');
      expect(renderedBlueprint).toContain('<header data-slot="search-overlay">');
      expect(renderedBlueprint).toContain('<aside data-slot="suggestion-panel" />');
      expect(renderedBlueprint).toContain('<aside data-slot="floating-controls" />');
      expect(renderedBlueprint).toContain('<footer data-slot="place-info-sheet">');
      expect(renderedBlueprint).toContain('<section data-slot="confirm-action" />');

      expect(PLACE_PICKER_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="map-surface"');
      expect(PLACE_PICKER_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="search-overlay"');
      expect(PLACE_PICKER_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="suggestion-panel"');
      expect(PLACE_PICKER_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="floating-controls"');
      expect(PLACE_PICKER_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="place-info-sheet"');
      expect(PLACE_PICKER_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="confirm-action"');
    } finally {
      act(() => {
        tree!.unmount();
      });
    }
  });
});
