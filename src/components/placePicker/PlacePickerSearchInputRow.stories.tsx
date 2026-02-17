import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';
import { PlacePickerSearchInputRow } from './PlacePickerSearchInputRow';

type PlacePickerSearchInputRowProps = ComponentProps<typeof PlacePickerSearchInputRow>;

const ControlledSearchInput = (args: PlacePickerSearchInputRowProps) => {
  const [value, setValue] = useState(args.value);
  const [isFocused, setFocused] = useState(args.isFocused);

  return (
    <View style={{ maxWidth: 540, padding: 20, width: '100%' }}>
      <PlacePickerSearchInputRow
        {...args}
        isFocused={isFocused}
        onBlur={() => {
          setFocused(false);
          args.onBlur();
        }}
        onChangeText={(next) => {
          setValue(next);
          args.onChangeText(next);
        }}
        onFocus={() => {
          setFocused(true);
          args.onFocus();
        }}
        value={value}
      />
    </View>
  );
};

const meta = {
  title: 'Place Picker/PlacePickerSearchInputRow',
  component: PlacePickerSearchInputRow,
  args: {
    value: 'Tokyo Station',
    editable: true,
    isFocused: false,
    placeholder: 'Search places',
    onBackPress: fn(),
    onChangeText: fn(),
    onFocus: fn(),
    onBlur: fn(),
    onSubmitEditing: fn(),
    onClear: fn(),
    clearAccessibilityLabel: 'Clear search',
  },
  render: (args) => <ControlledSearchInput {...args} />,
} satisfies Meta<typeof PlacePickerSearchInputRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    value: '',
    isFocused: true,
  },
};
