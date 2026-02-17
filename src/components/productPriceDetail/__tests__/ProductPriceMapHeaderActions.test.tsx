import { useState } from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProductPriceMapHeaderActions } from '../ProductPriceMapHeaderActions';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) => <View {...props} iconName={name} />
  };
});

describe('ProductPriceMapHeaderActions', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('fires back/share actions and toggles favorite icon state', () => {
    const onBack = jest.fn();
    const onShare = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    const Harness = () => {
      const [isFavorite, setIsFavorite] = useState(false);

      return (
        <ProductPriceMapHeaderActions
          isFavorite={isFavorite}
          onBack={onBack}
          onFavorite={() => setIsFavorite((current) => !current)}
          onShare={onShare}
        />
      );
    };

    act(() => {
      tree = renderer.create(<Harness />);
    });

    const backButton = tree.root.findByProps({ accessibilityLabel: 'detail-back-button' });
    const favoriteButton = tree.root.findByProps({ accessibilityLabel: 'detail-favorite-button' });
    const shareButton = tree.root.findByProps({ accessibilityLabel: 'detail-share-button' });

    expect(tree.root.findAll((node) => node.props.iconName === 'heart-outline').length).toBeGreaterThan(0);

    act(() => {
      backButton.props.onPress();
      shareButton.props.onPress();
      favoriteButton.props.onPress();
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(tree.root.findAll((node) => node.props.iconName === 'heart').length).toBeGreaterThan(0);
  });
});
