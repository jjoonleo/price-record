import path from 'path';
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(ts|tsx|js|jsx)'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  typescript: {
    reactDocgen: false,
  },
  babel: async (options) => ({
    ...options,
    presets: [...(options?.presets ?? []), require.resolve('babel-preset-expo')],
  }),
  webpackFinal: async (webpackConfig) => {
    const nextConfig = webpackConfig;
    nextConfig.resolve = nextConfig.resolve ?? {};
    nextConfig.resolve.alias = {
      ...(nextConfig.resolve.alias ?? {}),
      'react-native$': 'react-native-web',
      'react-native/index': 'react-native-web/dist/index.js',
      'expo-location$': path.resolve(__dirname, './mocks/expo-location.ts'),
    };
    nextConfig.resolve.extensions = [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.cjs',
      '.json',
    ];
    nextConfig.resolve.modules = [
      path.resolve(__dirname, '..'),
      ...(nextConfig.resolve.modules ?? ['node_modules']),
    ];
    nextConfig.module = nextConfig.module ?? { rules: [] };
    nextConfig.module.rules = nextConfig.module.rules ?? [];
    nextConfig.module.rules.push({
      test: /\.[jt]sx?$/,
      include: [
        path.resolve(__dirname, '../src'),
        path.resolve(__dirname, '../.storybook'),
        path.resolve(__dirname, '../node_modules/react-native'),
        path.resolve(__dirname, '../node_modules/react-native-web'),
        path.resolve(__dirname, '../node_modules/expo-linear-gradient'),
        path.resolve(__dirname, '../node_modules/expo-modules-core'),
        path.resolve(__dirname, '../node_modules/@expo/vector-icons'),
      ],
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [require.resolve('babel-preset-expo')],
          },
        },
      ],
    });
    return nextConfig;
  },
};

export default config;
