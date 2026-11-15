import { Platform } from 'react-native';

export const PRIVACY_POLICY_URL =
  'https://ruslanlittlewell.github.io/simple-baby-timer/privacy.html';



// The App Store listing uses Apple's standard EULA; Google Play has no such default.
export const TERMS_URL =
  Platform.OS === 'ios'
    ? 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
    : 'https://ruslanlittlewell.github.io/simple-baby-timer/terms.html';
