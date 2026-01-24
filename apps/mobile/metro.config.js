const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

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

// Allow importing from packages folder
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Handle .js -> .ts resolution for monorepo packages that use ESM-style imports
// This is needed because @demonicka/shared uses .js extensions in imports
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Check if this is a .js import from our packages
  if (moduleName.endsWith('.js')) {
    const tsModuleName = moduleName.replace(/\.js$/, '.ts');
    try {
      return context.resolveRequest(context, tsModuleName, platform);
    } catch {
      // Fall back to original if .ts doesn't exist
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
