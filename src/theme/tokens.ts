import { Platform } from 'react-native';

export const colors = {
  ink900: '#12243B',
  ink700: '#35506F',
  sky100: '#EDF7FF',
  sky200: '#DCEEFF',
  sky300: '#C4E3FF',
  mint200: '#C9F3EA',
  sea500: '#1C7C8C',
  coral500: '#F1644E',
  amber500: '#F1A93B',
  white: '#FFFFFF',
  slate100: '#F5F8FC',
  slate300: '#D5DFED',
  slate500: '#8A9AB0'
};

export const gradients = {
  screen: ['#EAF5FF', '#F7FBFF', '#E8FFF9'] as const,
  card: ['#FFFFFF', '#F4FAFF'] as const,
  highlight: ['#DBF4F5', '#FFF4E7'] as const
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36
};

export const typography = {
  display: Platform.select({
    ios: 'AvenirNext-Bold',
    android: 'sans-serif-medium',
    default: 'System'
  }),
  body: Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'sans-serif',
    default: 'System'
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace'
  })
};

export const shadows = {
  soft: {
    shadowColor: '#163150',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3
  }
};
