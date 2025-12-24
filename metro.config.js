const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any additional custom configuration here
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;
