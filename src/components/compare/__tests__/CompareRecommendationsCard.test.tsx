import renderer, { act } from 'react-test-renderer';
import { CompareRecommendationsCard } from '../CompareRecommendationsCard';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons'
}));

describe('CompareRecommendationsCard', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('fires row selection callback with selected store id', () => {
    const onSelect = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <CompareRecommendationsCard
          title="Top Recommendations"
          rows={[
            {
              storeId: 'store-2',
              rank: 2,
              storeName: 'Aeon Mall',
              metaText: '1.2km • Shinjuku',
              priceText: '¥138',
              statusText: 'Save ¥30',
              statusTone: 'positive'
            },
            {
              storeId: 'store-3',
              rank: 3,
              storeName: 'Matsumoto Kiyoshi',
              metaText: '0.5km • Shibuya',
              priceText: '¥142',
              statusText: 'Save ¥26',
              statusTone: 'muted'
            }
          ]}
          onSelect={onSelect}
        />
      );
    });

    try {
      const buttons = tree.root.findAll(
        (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
      );
      expect(buttons).toHaveLength(2);

      act(() => {
        buttons[1].props.onPress();
      });

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('store-3');
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
