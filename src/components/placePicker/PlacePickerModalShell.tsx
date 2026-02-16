import { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';

type PlacePickerModalShellProps = {
  visible: boolean;
  edges?: Edge[];
  children: ReactNode;
};

export const PlacePickerModalShell = ({
  visible,
  edges = ['left', 'right'],
  children
}: PlacePickerModalShellProps) => {
  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={edges} style={styles.screen}>
        <View style={styles.mapShell}>{children}</View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  mapShell: {
    flex: 1,
    position: 'relative'
  }
});
