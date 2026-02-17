import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { EntryLocationMap } from './EntryLocationMap';

const meta = {
  title: 'Components/EntryLocationMap',
  component: EntryLocationMap,
  args: {
    latitude: 35.6812,
    longitude: 139.7671,
    storeName: 'Tokyo Station Mart',
    cityArea: 'Marunouchi',
  },
  render: (args) => (
    <View style={{ maxWidth: 520, padding: 20, width: '100%' }}>
      <EntryLocationMap {...args} />
    </View>
  ),
} satisfies Meta<typeof EntryLocationMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OsakaArea: Story = {
  args: {
    latitude: 34.7025,
    longitude: 135.4959,
    storeName: 'Namba Fresh Point',
    cityArea: 'Namba',
  },
};
