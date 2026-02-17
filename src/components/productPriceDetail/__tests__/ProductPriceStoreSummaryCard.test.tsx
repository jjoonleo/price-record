import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { ProductPriceStoreSummaryCard } from '../ProductPriceStoreSummaryCard';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) => <View {...props} iconName={name} />
  };
});

describe('ProductPriceStoreSummaryCard', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('renders optional address and status rows when provided', () => {
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <ProductPriceStoreSummaryCard
          addressLine="28-6 Udagawacho, Shibuya City"
          cityArea="Shibuya, Tokyo"
          closeTimeLabel="Closes 11 PM"
          directionsLabel="Get Directions"
          onDirections={() => {}}
          openStatusLabel="Open Now"
          storeName="Mega Don Quijote"
          width={358}
        />
      );
    });

    const textValues = tree.root.findAllByType(Text).map((node) => node.props.children).flat();
    expect(textValues).toContain('28-6 Udagawacho, Shibuya City');
    expect(textValues).toContain('Open Now');
    expect(textValues).toContain('Closes 11 PM');
  });

  it('hides optional rows when values are missing', () => {
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <ProductPriceStoreSummaryCard
          cityArea="Shibuya, Tokyo"
          directionsLabel="Get Directions"
          onDirections={() => {}}
          storeName="Mega Don Quijote"
          width={358}
        />
      );
    });

    const textValues = tree.root.findAllByType(Text).map((node) => node.props.children).flat();
    expect(textValues).not.toContain('Open Now');
    expect(textValues).not.toContain('Closes 11 PM');
    expect(textValues).not.toContain('28-6 Udagawacho, Shibuya City');
  });
});
