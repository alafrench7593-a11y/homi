/**
 * Mêmes tests de rendu avec la plateforme Android : modules React Native résolus en version Android
 * (haste.defaultPlatform) et Platform.OS / process.env.EXPO_OS remplacés par « android » à la compilation.
 *   npx jest -c jest.android.config.js src/__tests__/communityScreens.test.tsx
 */
const base = require('./package.json').jest;
const main = require('jest-expo/jest-preset');

const transform = {};
for (const [key, value] of Object.entries(main.transform)) {
  transform[key] = Array.isArray(value) && value[0] === 'babel-jest'
    ? ['babel-jest', { ...value[1], caller: { ...(value[1].caller || {}), platform: 'android' } }]
    : value;
}
module.exports = { ...base, rootDir: __dirname, transform, haste: { ...main.haste, defaultPlatform: 'android' }, cacheDirectory: '/tmp/jest-android-cache' };
