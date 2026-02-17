import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { typography } from '../../theme/tokens';

type OutlineIconButtonProps = {
  label: string;
  iconName: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const OutlineIconButton = ({ label, iconName, onPress, style, textStyle }: OutlineIconButtonProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <MaterialCommunityIcons color="#334155" name={iconName} size={16} />
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  label: {
    color: '#334155',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  pressed: {
    opacity: 0.82
  }
});
