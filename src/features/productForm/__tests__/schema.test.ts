import { createProductFormSchema, getProductFormDefaults, PRODUCT_NOTE_LIMIT } from '../schema';

const messages = {
  productNameRequired: 'product name required',
  productNoteTooLong: 'note too long'
};

const schema = createProductFormSchema(messages);

describe('product form schema', () => {
  it('requires product name', () => {
    const result = schema.safeParse({
      ...getProductFormDefaults(),
      name: '   '
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.flatten().fieldErrors.name).toContain(messages.productNameRequired);
  });

  it('allows empty notes', () => {
    const result = schema.safeParse({
      ...getProductFormDefaults(),
      name: 'Green Tea'
    });

    expect(result.success).toBe(true);
  });

  it('limits note length', () => {
    const result = schema.safeParse({
      name: 'Green Tea',
      note: 'a'.repeat(PRODUCT_NOTE_LIMIT + 1)
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.flatten().fieldErrors.note).toContain(messages.productNoteTooLong);
  });
});
