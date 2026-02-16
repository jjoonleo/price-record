import * as React from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type Props = {
  value: Date;
  preview: string;
  labelDone: string;
  onChange: (nextDate: Date) => void;
};

export const ObservedDateInput = ({ value, preview, labelDone, onChange }: Props) => {
  const [open, setOpen] = React.useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));
    }
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <Text style={styles.text}>{preview}</Text>
      </Pressable>
      {open ? (
        <View style={styles.wrap}>
          <DateTimePicker
            value={value}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setOpen(false)} style={styles.doneBtn}>
              <Text style={styles.doneText}>{labelDone}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.slate100,
    marginBottom: spacing.sm
  },
  text: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontSize: 15
  },
  wrap: {
    borderWidth: 1,
    borderColor: colors.sky200,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm
  },
  doneBtn: {
    alignSelf: 'flex-end',
    marginRight: spacing.sm,
    marginBottom: spacing.sm
  },
  doneText: {
    color: colors.sea500,
    fontFamily: typography.body,
    fontWeight: '700'
  }
});
