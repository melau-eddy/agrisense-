// Add this at the VERY TOP of your entry file
import 'react-native-gesture-handler';

// Then the rest of your imports
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
