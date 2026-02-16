import { ReactElement } from 'react';
import { Animated } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { PlacePickerConfirmAction } from '../PlacePickerConfirmAction';
import { PlacePickerInfoHeader } from '../PlacePickerInfoHeader';
import { PlacePickerInfoSheet } from '../PlacePickerInfoSheet';
import { PlacePickerPlaceDetails } from '../PlacePickerPlaceDetails';

const renderWithAct = (element: ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
};

describe('PlacePickerInfoSheet composition', () => {
  it('shows title/meta/details and hides website row when url is missing', () => {
    const tree = renderWithAct(
      <PlacePickerInfoSheet
        isVisible
        onLayout={() => {}}
        panHandlers={{}}
        translateY={new Animated.Value(0)}
      >
        <PlacePickerInfoHeader meta="Shibuya" onClose={() => {}} title="Store Name" />
        <PlacePickerPlaceDetails
          addressLine="1-2-3 Shibuya"
          cityAreaLabel="Shibuya"
          noAddressLabel="No address"
          onOpenWebsite={() => {}}
          websiteLabel={null}
          websiteUri={undefined}
        />
        <PlacePickerConfirmAction
          confirmLabel="Confirm location"
          isResolvingAddress={false}
          onConfirm={() => {}}
          resolvingLabel="Resolving"
        />
      </PlacePickerInfoSheet>
    );

    try {
      expect(tree.root.findByProps({ children: 'Store Name' })).toBeTruthy();
      expect(tree.root.findAllByProps({ children: 'Shibuya' }).length).toBeGreaterThan(0);
      expect(tree.root.findByProps({ children: '1-2-3 Shibuya' })).toBeTruthy();
      expect(tree.root.findAllByProps({ children: 'example.com' })).toHaveLength(0);
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });

  it('fires confirm callback from composed confirm action', () => {
    const onConfirm = jest.fn();

    const tree = renderWithAct(
      <PlacePickerInfoSheet
        isVisible
        onLayout={() => {}}
        panHandlers={{}}
        translateY={new Animated.Value(0)}
      >
        <PlacePickerInfoHeader meta="Shibuya" onClose={() => {}} title="Store Name" />
        <PlacePickerPlaceDetails
          cityAreaLabel="Shibuya"
          noAddressLabel="No address"
          onOpenWebsite={() => {}}
        />
        <PlacePickerConfirmAction
          confirmLabel="Confirm location"
          isResolvingAddress={false}
          onConfirm={onConfirm}
          resolvingLabel="Resolving"
        />
      </PlacePickerInfoSheet>
    );

    try {
      act(() => {
        tree.root.findByType(PrimaryButton).props.onPress();
      });

      expect(onConfirm).toHaveBeenCalledTimes(1);
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
