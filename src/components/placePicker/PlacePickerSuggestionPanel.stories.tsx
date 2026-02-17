import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { placePickerSuggestionsFixture } from '../../storybook/fixtures/placePicker';
import { PlacePickerSuggestionPanel } from './PlacePickerSuggestionPanel';

const meta = {
  title: 'Place Picker/PlacePickerSuggestionPanel',
  component: PlacePickerSuggestionPanel,
  args: {
    isVisible: true,
    isLoading: false,
    suggestions: placePickerSuggestionsFixture,
    selectedSuggestionId: 'shinjuku-central',
    loadingLabel: 'Searching places...',
    applyingLabel: 'Applying...',
    isWeb: false,
    onSuggestionPressIn: fn(),
    onSuggestionPress: fn(),
  },
  render: (args) => (
    <View style={{ maxWidth: 520, padding: 20, width: '100%' }}>
      <PlacePickerSuggestionPanel {...args} />
    </View>
  ),
} satisfies Meta<typeof PlacePickerSuggestionPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithSuggestions: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
    suggestions: [],
    selectedSuggestionId: null,
  },
};
