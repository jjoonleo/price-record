import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

type IconCircleButtonProps = {
  accessibilityLabel: string;
  iconName: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  size?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const IconCircleButton = ({
  accessibilityLabel,
  iconName,
  onPress,
  size = 16,
  iconColor = colors.primary,
  style
}: IconCircleButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <MaterialCommunityIcons color={iconColor} name={iconName} size={size} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    width: 32
  },
  pressed: {
    opacity: 0.82
  }
});
