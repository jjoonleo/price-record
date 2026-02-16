import { Platform } from 'react-native';

export const colors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',
  surfaceOverlay: 'rgba(255,255,255,0.92)',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#C7CDD6',
  divider: '#E5E7EB',
  dividerSoft: '#F3F4F6',
  borderSubtle: 'rgba(0,0,0,0.05)',
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  mapPin: '#FF3B30',
  ink900: '#111827',
  ink700: '#6B7280',
  sky100: '#F3F4F6',
  sky200: '#E5E7EB',
  sky300: '#D1D5DB',
  mint200: '#DCFCE7',
  sea500: '#007AFF',
  coral500: '#EF4444',
  amber500: '#FF9500',
  slate100: '#F3F4F6',
  slate300: '#D1D5DB',
  slate500: '#9CA3AF'
};

export const gradients = {
  screen: [colors.background, colors.background] as const,
  card: [colors.surface, colors.surface] as const,
  highlight: ['#EFF6FF', '#F8FAFC'] as const
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 20
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40
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
  }),
  sizes: {
    headingXl: 34,
    headingLg: 28,
    headingMd: 22,
    headingSm: 20,
    title: 17,
    body: 15,
    caption: 13,
    micro: 11
  }
};

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6
  },
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  }
};
