import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { PlacePickerModal } from './PlacePickerModal';

const meta = {
  title: 'Components/PlacePickerModal',
  component: PlacePickerModal,
  args: {
    visible: false,
    initialCoordinates: {
      latitude: 35.6812,
      longitude: 139.7671,
    },
    initialPlaceSelection: {
      latitude: 35.6812,
      longitude: 139.7671,
      cityArea: 'Marunouchi',
      addressLine: '1 Chome-9 Marunouchi, Chiyoda City',
      suggestedStoreName: 'Tokyo Station Mart',
    },
    showPlaceInfoInitially: false,
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof PlacePickerModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hidden: Story = {};

export const HiddenWithInfo: Story = {
  args: {
    showPlaceInfoInitially: true,
  },
};
