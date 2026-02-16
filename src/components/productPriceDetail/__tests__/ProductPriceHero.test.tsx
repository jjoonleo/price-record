import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { ProductPriceHero } from '../ProductPriceHero';

describe('ProductPriceHero', () => {
  beforeAll(() => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent !== 'function') {
      (window as { dispatchEvent?: (event: Event) => boolean }).dispatchEvent = () => true;
    }
  });

  it('renders product and price details', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ProductPriceHero
          dealLabel="Great Deal"
          dealTone="great"
          imageSource={{ uri: 'https://example.com/temp.png' }}
          priceText="398"
          productName="Matcha KitKat"
          width={358}
        />
      );
    });

    const textValues = tree.root.findAllByType(Text).map((node) => node.props.children).flat();

    expect(textValues).toContain('Matcha KitKat');
    expect(textValues).toContain('398');
    expect(textValues).toContain('Great Deal');
  });
});
