import renderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { ComparePriceComparisonCard } from '../ComparePriceComparisonCard';

describe('ComparePriceComparisonCard', () => {
  it('renders rows and fires view full history callback', () => {
    const onViewFullHistory = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <ComparePriceComparisonCard
          title="Price Comparison"
          rows={[
            {
              storeId: 'store-1',
              storeName: 'Don Quijote',
              priceText: '¥128',
              widthPercent: 35,
              color: '#137FEC',
              isBest: true
            },
            {
              storeId: 'store-2',
              storeName: 'Seiyu',
              priceText: '¥145',
              widthPercent: 55,
              color: '#94A3B8',
              isBest: false
            }
          ]}
          viewHistoryLabel="View Full History"
          onViewFullHistory={onViewFullHistory}
        />
      );
    });

    const buttons = tree.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
    );
    expect(buttons).toHaveLength(1);

    const textNodes = tree.root.findAllByType(Text);
    expect(textNodes.length).toBeGreaterThan(0);

    act(() => {
      buttons[0].props.onPress();
    });

    expect(onViewFullHistory).toHaveBeenCalledTimes(1);
  });
});
