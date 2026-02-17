const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const isStorybookEnabled =
  process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true' ||
  process.argv.some((arg) => arg.includes('index.storybook.js'));

if (isStorybookEnabled) {
  const ttyShimPath = path.resolve(__dirname, 'shims/tty.js');

  try {
    const withStorybook = require('@storybook/react-native/metro/withStorybook');
    const storybookConfig = withStorybook(config, {
      enabled: true,
      configPath: path.resolve(__dirname, '.rnstorybook'),
    });
    storybookConfig.resolver = storybookConfig.resolver || {};
    storybookConfig.resolver.extraNodeModules = {
      ...(storybookConfig.resolver.extraNodeModules || {}),
      tty: ttyShimPath,
      'node:tty': ttyShimPath,
    };
    module.exports = storybookConfig;
  } catch (error) {
    console.warn(
      '[metro] EXPO_PUBLIC_STORYBOOK_ENABLED=true but Storybook Metro integration is unavailable. Falling back to default Metro config.'
    );
    module.exports = config;
  }
} else {
  module.exports = config;
}
