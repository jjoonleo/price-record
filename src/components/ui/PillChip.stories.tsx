import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PillChip } from './PillChip';

const meta = {
  title: 'UI/PillChip',
  component: PillChip,
  args: {
    label: 'Shinjuku',
    active: false,
    onPress: fn(),
  },
  render: (args) => (
    <View style={{ alignItems: 'flex-start', padding: 20 }}>
      <PillChip {...args} />
    </View>
  ),
} satisfies Meta<typeof PillChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const chip = await canvas.findByRole('button', { name: /shinjuku/i });

    await userEvent.click(chip);
    await expect(args.onPress).toHaveBeenCalledTimes(1);
  },
};

export const Active: Story = {
  args: {
    active: true,
  },
};
