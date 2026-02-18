import renderer, { act } from 'react-test-renderer';
import { CompareBestValueCard } from '../CompareBestValueCard';

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons'
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient'
}));

describe('CompareBestValueCard', () => {
  it('fires onPressCard when the best value tile is pressed', () => {
    const onPressCard = jest.fn();
    const onNavigate = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <CompareBestValueCard
          bestLabel="Best Value"
          priceText="¥128"
          storeText="Don Quijote (Shibuya)"
          vsAvgPercentText="-12%"
          vsAvgLabel="vs avg"
          lastVerifiedText="Today"
          navigateLabel="Navigate"
          onPressCard={onPressCard}
          onNavigate={onNavigate}
        />
      );
    });

    try {
      const buttons = tree.root.findAll(
        (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
      );

      const tileButton = buttons.find(
        (node) => {
          const styleResult =
            typeof node.props.style === 'function'
              ? node.props.style({ pressed: false })
              : node.props.style;
          const styleItems = (Array.isArray(styleResult) ? styleResult : [styleResult]).filter(Boolean);
          return styleItems.some((style) => style.position === 'absolute');
        }
      );

      expect(tileButton).toBeDefined();

      act(() => {
        tileButton?.props.onPress();
      });

      expect(onPressCard).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledTimes(0);
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });

  it('fires onNavigate when navigate button is pressed', () => {
    const onPressCard = jest.fn();
    const onNavigate = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <CompareBestValueCard
          bestLabel="Best Value"
          priceText="¥128"
          storeText="Don Quijote (Shibuya)"
          vsAvgPercentText="-12%"
          vsAvgLabel="vs avg"
          lastVerifiedText="Today"
          navigateLabel="Navigate"
          onPressCard={onPressCard}
          onNavigate={onNavigate}
        />
      );
    });

    try {
      const buttons = tree.root.findAll(
        (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
      );

      const navigateButton = buttons.find(
        (node) => {
          const styleResult =
            typeof node.props.style === 'function'
              ? node.props.style({ pressed: false })
              : node.props.style;
          const styleItems = (Array.isArray(styleResult) ? styleResult : [styleResult]).filter(Boolean);
          return !styleItems.some((style) => style.position === 'absolute');
        }
      );

      expect(navigateButton).toBeDefined();

      act(() => {
        navigateButton?.props.onPress();
      });

      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onPressCard).toHaveBeenCalledTimes(0);
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
