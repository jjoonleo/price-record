import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import { ObservedDateInput } from './ObservedDateInput';

type ObservedDateInputProps = ComponentProps<typeof ObservedDateInput>;

const ControlledObservedDateInput = (args: ObservedDateInputProps) => {
  const [value, setValue] = useState(args.value);

  const preview = value.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={{ maxWidth: 360, width: '100%' }}>
      <ObservedDateInput
        {...args}
        labelDone={args.labelDone}
        onChange={setValue}
        preview={preview}
        value={value}
      />
    </View>
  );
};

const meta = {
  title: 'Components/ObservedDateInput',
  component: ObservedDateInput,
  args: {
    value: new Date(2026, 1, 17),
    preview: 'Feb 17, 2026',
    labelDone: 'Done',
    onChange: () => {},
  },
  render: (args) => <ControlledObservedDateInput {...args} />,
} satisfies Meta<typeof ObservedDateInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EarlyDate: Story = {
  args: {
    value: new Date(2026, 0, 5),
  },
};
