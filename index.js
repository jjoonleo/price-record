if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true') {
  require('./index.storybook');
} else {
  require('expo-router/entry');
}
