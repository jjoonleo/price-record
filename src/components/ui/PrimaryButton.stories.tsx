import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PrimaryButton } from './PrimaryButton';

const meta = {
  title: 'UI/PrimaryButton',
  component: PrimaryButton,
  args: {
    label: 'Save Entry',
    onPress: fn(),
    disabled: false,
  },
  render: (args) => (
    <View style={{ maxWidth: 320, width: '100%' }}>
      <PrimaryButton {...args} />
    </View>
  ),
} satisfies Meta<typeof PrimaryButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = await canvas.findByRole('button', { name: /save entry/i });

    await userEvent.click(button);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
