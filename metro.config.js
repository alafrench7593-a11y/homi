// Configuration Metro (Expo) : identique à celle par défaut, avec un correctif de résolution pour « tslib »
// et, sur le web seulement, un module léger à la place du SDK d'achats intégrés.
// pdf-lib (création des PDF sur l'appareil) importe tslib ; avec les « exports » de paquet, Metro choisissait
// l'entrée ESM de tslib 2 (modules/index.js), dont l'import par défaut d'un fichier CommonJS échoue sur le web.
// On pointe donc toujours vers la version CommonJS autonome de tslib.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'node_modules/tslib/tslib.js') };
  }
  // Web : pas d'achats intégrés (App Store / Google Play seulement) — module léger à la place du SDK de paiement
  if (platform === 'web' && moduleName === 'react-native-purchases') {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'src/lib/purchasesWebStub.ts') };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
