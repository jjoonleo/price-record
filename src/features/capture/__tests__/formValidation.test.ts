import {
  CAPTURE_NOTES_LIMIT,
  createCaptureFormSchema,
  getCaptureFormDefaults
} from '../formValidation';

const messages = {
  productRequired: 'product required',
  priceRequired: 'price required',
  priceInvalidInteger: 'price integer',
  pricePositive: 'price positive',
  storeRequired: 'store required',
  cityAreaRequired: 'city required',
  dateRequired: 'date required',
  locationRequired: 'location required',
  addressRequired: 'address required',
  coordinatesInvalid: 'coords invalid',
  notesTooLong: 'notes too long'
};

const schema = createCaptureFormSchema(messages);

const createValidValues = () => ({
  ...getCaptureFormDefaults(),
  productName: 'Green Tea',
  priceYen: '250',
  storeName: 'Lawson',
  cityArea: 'Chiyoda',
  latitude: '35.6812',
  longitude: '139.7671',
  addressLine: '1 Chome-9 Marunouchi, Chiyoda City, Tokyo',
  hasMapSelection: true
});

describe('createCaptureFormSchema', () => {
  test('accepts valid payload', () => {
    const result = schema.safeParse(createValidValues());
    expect(result.success).toBe(true);
  });

  test('requires product and store names', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      productName: ' ',
      storeName: ' '
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.productName).toContain(messages.productRequired);
    expect(result.error.flatten().fieldErrors.storeName).toContain(messages.storeRequired);
  });

  test('requires price value', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      priceYen: ' '
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.priceYen).toContain(messages.priceRequired);
  });

  test('rejects non-integer price', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      priceYen: '12.3'
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.priceYen).toContain(messages.priceInvalidInteger);
  });

  test('rejects non-positive price', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      priceYen: '0'
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.priceYen).toContain(messages.pricePositive);
  });

  test('requires map selection', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      hasMapSelection: false
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.hasMapSelection).toContain(messages.locationRequired);
  });

  test('requires address after map selection', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      addressLine: '   '
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.addressLine).toContain(messages.addressRequired);
  });

  test('rejects invalid coordinates', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      latitude: '120',
      longitude: '200'
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.latitude).toContain(messages.coordinatesInvalid);
    expect(result.error.flatten().fieldErrors.longitude).toContain(messages.coordinatesInvalid);
  });

  test('rejects notes exceeding limit', () => {
    const result = schema.safeParse({
      ...createValidValues(),
      notes: 'a'.repeat(CAPTURE_NOTES_LIMIT + 1)
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.notes).toContain(messages.notesTooLong);
  });
});
