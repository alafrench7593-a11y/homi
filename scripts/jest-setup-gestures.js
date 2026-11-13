/**
 * Tests : react-native-gesture-handler 3.3 (panneau du bas gestuel, src/components/Overlays.tsx).
 *  - mocks officiels de la bibliothèque (module natif, boutons, détecteur) ;
 *  - sous Jest, Reanimated / Worklets tournent dans leur implémentation web (résolveur de package.json) : l'installation
 *    des liaisons du fil UI de Gesture Handler (`getUIRuntimeHolder`) n'y existe pas → neutralisée ici.
 */
require('react-native-gesture-handler/jestSetup');

// Chemin réel (node_modules peut être un lien symbolique : Jest compare les chemins résolus)
const path = require('path');
const fs = require('fs');
const root = path.dirname(fs.realpathSync(require.resolve('react-native-gesture-handler/package.json')));
for (const dir of ['src', 'lib/module'].filter((d) => fs.existsSync(path.join(root, d)))) {
  jest.doMock(path.join(root, dir, 'handlers/gestures/installUIRuntimeBindings'), () => ({ installUIRuntimeBindings: () => undefined }));
}
