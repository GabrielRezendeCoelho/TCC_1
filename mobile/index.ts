import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent chama AppRegistry.registerComponent('main', () => App);
// Também garante que, quer você carregue o app no Expo Go ou numa build nativa,
// o ambiente esteja configurado apropriadamente
registerRootComponent(App);
