import { ReactElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PlacePickerStatusMessages } from '../PlacePickerStatusMessages';

const renderWithAct = (element: ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
};

describe('PlacePickerStatusMessages', () => {
  it('renders fallback message only', () => {
    const tree = renderWithAct(
      <PlacePickerStatusMessages
        fallbackMessage="Search key missing"
        locationStatusMessage={null}
        searchErrorMessage={null}
      />
    );

    try {
      expect(tree.root.findByProps({ children: 'Search key missing' })).toBeTruthy();
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });

  it('renders search and location errors', () => {
    const tree = renderWithAct(
      <PlacePickerStatusMessages
        fallbackMessage={null}
        locationStatusMessage="Location denied"
        searchErrorMessage="Search unavailable"
      />
    );

    try {
      expect(tree.root.findByProps({ children: 'Search unavailable' })).toBeTruthy();
      expect(tree.root.findByProps({ children: 'Location denied' })).toBeTruthy();
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });

  it('renders nothing when all messages are empty', () => {
    const tree = renderWithAct(
      <PlacePickerStatusMessages fallbackMessage={null} locationStatusMessage={null} searchErrorMessage={null} />
    );

    try {
      expect(tree.toJSON()).toBeNull();
    } finally {
      act(() => {
        tree.unmount();
      });
    }
  });
});
