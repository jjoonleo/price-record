import { Text } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { CompareLayoutBlueprint, COMPARE_LAYOUT_BLUEPRINT_HTML } from '../CompareLayoutBlueprint.web';

describe('CompareLayoutBlueprint', () => {
  it('exposes semantic anatomy slots for compare screen composition', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(<CompareLayoutBlueprint />);
    });

    try {
      const renderedLines = tree.root.findAllByType(Text).map((lineNode) => String(lineNode.props.children));
      const renderedBlueprint = renderedLines.join('\n');

      expect(renderedBlueprint).toContain('<main data-screen="compare">');
      expect(renderedBlueprint).toContain('<header data-slot="compare-header" />');
      expect(renderedBlueprint).toContain('<section data-slot="product-hero" />');
      expect(renderedBlueprint).toContain('<section data-slot="best-value-card" />');
      expect(renderedBlueprint).toContain('<section data-slot="price-comparison-card">');
      expect(renderedBlueprint).toContain('<button data-slot="view-full-history" />');
      expect(renderedBlueprint).toContain('<section data-slot="top-recommendations-card" />');

      expect(COMPARE_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="compare-header"');
      expect(COMPARE_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="product-hero"');
      expect(COMPARE_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="best-value-card"');
      expect(COMPARE_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="price-comparison-card"');
      expect(COMPARE_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="view-full-history"');
      expect(COMPARE_LAYOUT_BLUEPRINT_HTML).toContain('data-slot="top-recommendations-card"');
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
