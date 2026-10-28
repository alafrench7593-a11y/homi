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
// expo-notifications charge des modules natifs Android à l'import (absents sous Node) : remplacé par un module vide
// pour les suites qui ne le simulent pas elles-mêmes.
const moduleNameMapper = { ...base.moduleNameMapper, '^expo-notifications$': '<rootDir>/jest-stubs/expoNotifications.js' };
module.exports = { ...base, rootDir: __dirname, transform, moduleNameMapper, haste: { ...main.haste, defaultPlatform: 'android' }, cacheDirectory: '/tmp/jest-android-cache' };
