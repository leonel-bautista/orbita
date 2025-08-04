import './components/orbi-logo.js'
import './components/orbi-icon.js'
import './components/orbi-error.js'
import './components/orbi-nav.js'
import './components/orbi-panel.js'

import { getProfile } from './client.js';

(async function loadSession() {
    let user = null;

    try{ user = await getProfile(); }
    catch (err){}

    document.dispatchEvent(new CustomEvent('user-loaded', { detail: user }));
})();