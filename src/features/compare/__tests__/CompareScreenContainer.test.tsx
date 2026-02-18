import renderer, { act } from 'react-test-renderer';
import { CompareScreenContainer } from '../CompareScreenContainer';

const mockNavigate = jest.fn();
const mockApplyFullHistoryFilter = jest.fn();
const mockUseCompareScreenController = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate
  })
}));

jest.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({
    language: 'en',
    t: (key: string) => key
  })
}));

jest.mock('../hooks/useCompareScreenController', () => ({
  useCompareScreenController: (...args: unknown[]) =>
    mockUseCompareScreenController(...args)
}));

jest.mock('../../../components/compare', () => ({
  CompareBestValueCard: () => null,
  CompareEmptyStateCard: () => null,
  CompareHeader: () => null,
  CompareHero: () => null,
  ComparePriceComparisonCard: ({
    onViewFullHistory
  }: {
    onViewFullHistory: () => void;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable accessibilityRole="button" onPress={onViewFullHistory}>
        <Text>view-history</Text>
      </Pressable>
    );
  },
  CompareRecommendationsCard: () => null
}));

describe('CompareScreenContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCompareScreenController.mockReturnValue({
      selectedProduct: {
        id: 'product-1',
        name: 'Matcha KitKat',
        entryCount: 10
      },
      selectedProductImageUri: '',
      topChoice: {
        storeId: 'store-1',
        priceEntryId: 'entry-1',
        storeName: 'Don Quijote',
        cityArea: 'Shibuya',
        addressLine: 'Address',
        latitude: 35.66,
        longitude: 139.7,
        latestPriceYen: 392,
        observedAt: '2026-02-17T10:00:00.000Z',
        distanceKm: 1.2,
        score: 0.9,
        tags: ['BEST']
      },
      hasLocation: true,
      isLoading: false,
      errorMessage: null,
      statusMessage: null,
      setStatusMessage: jest.fn(),
      priceComparisonRows: [],
      recommendationRows: [],
      vsAvgPercent: -12,
      lastVerifiedLabel: '2h ago',
      openDirections: jest.fn(),
      applyFullHistoryFilter: mockApplyFullHistoryFilter
    });
  });

  it('navigates to history with compare intent params when view full history is pressed', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(<CompareScreenContainer />);
    });

    try {
      const button = tree.root.find(
        (node) =>
          node.props.accessibilityRole === 'button' &&
          typeof node.props.onPress === 'function'
      );

      act(() => {
        button.props.onPress();
      });

      expect(mockApplyFullHistoryFilter).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: '/history',
        params: {
          source: 'compare',
          productId: 'product-1',
          intentId: '1700000000000'
        }
      });
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
