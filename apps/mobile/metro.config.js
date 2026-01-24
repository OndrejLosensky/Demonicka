const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

// Force react to resolve from mobile's node_modules only (React 19).
// react-native is hoisted to root; without this, Metro can resolve react from
// root (React 18 from web), causing "Invalid hook call" / "useId of null".
// AsyncStorage is hoisted to monorepo root; point Metro at it explicitly.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  react: path.join(projectRoot, 'node_modules', 'react'),
  '@react-native-async-storage/async-storage': path.join(
    monorepoRoot,
    'node_modules',
    '@react-native-async-storage',
    'async-storage'
  ),
};

module.exports = config;
