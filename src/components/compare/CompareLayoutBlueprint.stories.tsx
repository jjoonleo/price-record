import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { CompareLayoutBlueprint } from './CompareLayoutBlueprint.web';

const meta = {
  title: 'Compare/CompareLayoutBlueprint',
  component: CompareLayoutBlueprint,
  render: () => (
    <View style={{ maxWidth: 560, padding: 20, width: '100%' }}>
      <CompareLayoutBlueprint />
    </View>
  ),
} satisfies Meta<typeof CompareLayoutBlueprint>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
