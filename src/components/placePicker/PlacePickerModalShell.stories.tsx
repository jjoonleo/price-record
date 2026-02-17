import type { Meta, StoryObj } from '@storybook/react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlacePickerModalShell } from './PlacePickerModalShell';

const meta = {
  title: 'Place Picker/PlacePickerModalShell',
  component: PlacePickerModalShell,
  args: {
    visible: true,
    edges: ['left', 'right'] as const,
    children: null,
  },
  render: (args) => (
    <SafeAreaProvider>
      <PlacePickerModalShell {...args}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <Text>Modal shell content</Text>
        </View>
      </PlacePickerModalShell>
    </SafeAreaProvider>
  ),
} satisfies Meta<typeof PlacePickerModalShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Visible: Story = {};

export const Hidden: Story = {
  args: {
    visible: false,
  },
};
