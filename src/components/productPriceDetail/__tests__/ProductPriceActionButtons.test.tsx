import renderer, { act } from 'react-test-renderer';
import { ProductPriceActionButtons } from '../ProductPriceActionButtons';

describe('ProductPriceActionButtons', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('fires edit and delete callbacks', () => {
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

    act(() => {
      buttons[0].props.onPress();
      buttons[1].props.onPress();
    });

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
