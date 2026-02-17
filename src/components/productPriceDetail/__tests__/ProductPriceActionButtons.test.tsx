import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { ProductPriceActionButtons } from '../ProductPriceActionButtons';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) => <View {...props} iconName={name} />
  };
});

describe('ProductPriceActionButtons', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('renders delete then edit buttons and fires callbacks', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    let tree!: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <ProductPriceActionButtons
          deleteLabel="Delete Entry"
          editLabel="Edit Entry"
          onDelete={onDelete}
          onEdit={onEdit}
          width={358}
        />
      );
    });

    const buttons = tree.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function'
    );
    expect(buttons).toHaveLength(2);
    expect(buttons[0].findByType(Text).props.children).toBe('Delete Entry');
    expect(buttons[1].findByType(Text).props.children).toBe('Edit Entry');

    act(() => {
      buttons[0].props.onPress();
      buttons[1].props.onPress();
    });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete.mock.invocationCallOrder[0]).toBeLessThan(onEdit.mock.invocationCallOrder[0]);
  });
});
