import renderer, { act } from 'react-test-renderer';
import { ProductPriceMapHero } from '../ProductPriceMapHero';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) => <View {...props} iconName={name} />
  };
});

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');

  const MockMapView = ({ children, ...props }: any) => <View {...props}>{children}</View>;
  const MockMarker = ({ children, ...props }: any) => <View {...props}>{children}</View>;

  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker
  };
});

describe('ProductPriceMapHero', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('renders the map hero with centered shopping pin icon', () => {
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <ProductPriceMapHero
          latitude={35.658}
          longitude={139.7016}
          width={390}
        />
      );
    });

    expect(tree.root.findAll((node) => node.props.iconName === 'shopping').length).toBeGreaterThan(0);
  });
});
