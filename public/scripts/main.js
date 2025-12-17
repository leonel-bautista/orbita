import './components/orbi-logo.js'
import './components/orbi-icon.js'
import './components/orbi-error.js'
import './components/orbi-nav.js'
import './components/orbi-panel.js'

import { getProfile } from './client.js';

(async function loadSession() {
    let user = null;

    try {
        const res = await getProfile();
        user = res.ok ? res.body : null
    }
    catch (error) {}

    document.dispatchEvent(new CustomEvent('user-loaded', { detail: user }));
})();