import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { ProductPriceDetailLayoutBlueprint } from '../ProductPriceDetailLayoutBlueprint.web';

describe('ProductPriceDetailLayoutBlueprint', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('renders semantic section anatomy', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<ProductPriceDetailLayoutBlueprint />);
    });
    const textValues = tree.root.findAllByType(Text).map((node) => node.props.children).flat();

    expect(textValues).toContain('Product Price Detail Blueprint');
    expect(textValues).toContain('Header');
    expect(textValues).toContain('Information Section');
    expect(textValues).toContain('Action Buttons');
  });
});
