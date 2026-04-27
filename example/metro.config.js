const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');
const pak = require('../package.json');

const peers = Object.keys({ ...pak.peerDependencies });
const extraNodeModules = peers.reduce((acc, name) => {
  acc[name] = path.join(__dirname, 'node_modules', name);
  return acc;
}, {});

const config = {
  watchFolders: [root],
  resolver: {
    blockList: peers.map(
      (name) => new RegExp(`^${path.join(root, 'node_modules', name)}\\/.*$`),
    ),
    extraNodeModules,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
