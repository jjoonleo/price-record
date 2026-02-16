import { shouldApplySuggestedStoreName } from '../placeAutofill';

describe('shouldApplySuggestedStoreName', () => {
  it('allows autofill when user has not typed manually', () => {
    expect(
      shouldApplySuggestedStoreName({
        currentStoreName: 'Don Quijote',
        storeNameTouched: false,
        lastAutoFilledStoreName: null
      })
    ).toBe(true);
  });

  it('blocks autofill when user changed store manually', () => {
    expect(
      shouldApplySuggestedStoreName({
        currentStoreName: 'My custom nickname',
        storeNameTouched: true,
        lastAutoFilledStoreName: 'Don Quijote'
      })
    ).toBe(false);
  });

  it('allows autofill when current value still equals prior autofilled name', () => {
    expect(
      shouldApplySuggestedStoreName({
        currentStoreName: 'Tokyo Hands',
        storeNameTouched: true,
        lastAutoFilledStoreName: 'Tokyo Hands'
      })
    ).toBe(true);
  });
});
