import './components/orbi-logo.js'
import './components/orbi-icon.js'
import './components/orbi-error.js'
import './components/orbi-nav.js'
import './components/orbi-panel.js'

import { getProfile } from './client.js';

(async function loadSession() {
    const res = await getProfile();
    const user = res.ok ? res.body : null;

    const userLoaded = new CustomEvent('user-loaded', { detail: user });

    document.dispatchEvent(userLoaded);
})();