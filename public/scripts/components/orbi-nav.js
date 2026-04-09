const navStyle = `
    nav {
        height: 70px;
        display: flex;

        background: var(--color-bg-dark);
        align-items: center;
        gap: 1.5em;
        padding: 0 1.5rem;
        position: relative;

        > * {
            height: 100%;
            place-content: center;
        }

        .nav-links {
            position: relative;
            color: var(--color-text);
            text-decoration: none;
            text-transform: uppercase;

            font-family: var(--font-title);
            font-weight: 500;
            font-size: .9rem;
            font-kerning: none;

            transition: color 250ms ease-in-out, background-color 250ms ease-in-out;
        }
    }
    nav #logo-area {
        #home-link {
            padding: .5rem .8rem;
            display: block;

            &:hover, &:focus-visible {
                orbi-logo {
                    opacity: .5;
                }
            }
        }
        orbi-logo {
            height: 1.3rem;
            transition: opacity 300ms ease-out,
                        filter 300ms ease-out;
        }
    }
    nav #pages-area {
        height: 100%;
        width: 100%;
        padding: 0;
        flex: 1;
        display: inline-flex;
        list-style: none;
        font-weight: 500;
        justify-content: start;
        align-items: center;
        gap: 1em;

        .nav-links {
            padding: .5em .8em;
        }
        .nav-links:hover, .nav-links:focus-visible {
            color: var(--color-tertiary-900);
            translate: 0 .1rem;
        }
    }
    nav #user-area:has(#login-link) {
        #login-link {
            padding: .8rem 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.2rem;

            background: radial-gradient(
                ellipse at top left,
                var(--color-primary-700) 55%, 55.1%,
                var(--color-primary-800) 80%, 80.1%,
                var(--color-primary-900) 95%
                );
            border-radius: .3em;

            orbi-icon { height: 1rem; }
            span { place-content: center; }
        }
    }
    nav #user-area:has(img) {
        #open-panel-btn {
            padding: .5em 1em;
            border: none;
            border-radius: .2rem;
            display: flex;
            gap: 1rem;

            background-color: var(--color-);
            cursor: pointer;
            z-index: 5000;

            &:hover, &:focus-visible{
                box-shadow: 0 0 0 2px var(--color-tertiary-900);
            }

            img {
                aspect-ratio: 1 / 1;
                height: 2rem;
                border-radius: .25rem;
                border: 2px solid var(--color-text);
                object-fit: cover;
                object-position: center;
            }
            orbi-icon{
                height: 1.5rem;
                place-self: center;
                color: var(--color-text);
            }
        }
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${navStyle}</style>
    <nav>
        <div id="logo-area">
            <a href="." class="nav-links" id="home-link">
                <orbi-logo></orbi-logo>
            </a>
        </div>

        <ul id="pages-area">
            <li><a href="juegos" class="nav-links" id="games-link">juegos</a></li>
            <li><a href="aplicaciones" class="nav-links" id="downloads-link">aplicaciones</a></li>
            <li><a href="planes" class="nav-links" id="news-link">planes</a></li>
            <li><a href="acerca-de" class="nav-links" id="about-link">acerca de</a></li>
        </ul>

        <div id="user-area"></div>
    </nav>
`;

class OrbiNav extends HTMLElement {
    constructor() {
        super();
        
        const content = template.content.cloneNode(true);
        
        this.attachShadow({ mode: 'open' })
            .appendChild(content);
        
        this.$userArea = this.shadowRoot.querySelector('#user-area');

        this._onUser = this._onUser.bind(this);
        this._togglePanel = this._togglePanel.bind(this);
        this._onPanelOpened = this._onPanelOpened.bind(this);
        this._onPanelClosed = this._onPanelClosed.bind(this);

        this._currentAuthElement = null;
        this._panel = null;
    }

    connectedCallback() {
        document.addEventListener('user-loaded', this._onUser);

        this._panel = document.querySelector('orbi-panel');

        if (this._panel) {
            this._panel.addEventListener('panel-opened', this._onPanelOpened);
            this._panel.addEventListener('panel-closed', this._onPanelClosed);
        }
    }
    disconnectedCallback() {
        document.removeEventListener('user-loaded', this._onUser);

        if (this._panel) {
            this._panel.removeEventListener('panel-opened', this._onPanelOpened);
            this._panel.removeEventListener('panel-closed', this._onPanelClosed);
        }

        if (this._currentAuthElement && this._currentAuthElement.id === 'open-panel-btn') {
            this._currentAuthElement.removeEventListener('click', this._togglePanel);
        }
    }

    _onUser(e) {
        const user = e.detail;

        if (this._currentAuthElement && this._currentAuthElement.id === 'open-panel-btn') {
            this._currentAuthElement.removeEventListener('click', this._togglePanel);
        }

        this.$userArea.innerHTML = '';

        if (!user) {
            const loginLink = document.createElement('a');
            loginLink.href = `login?next=${encodeURIComponent(location.pathname)}`;
            loginLink.id = 'login-link';
            loginLink.className = 'nav-links';
            loginLink.innerHTML = `
                <orbi-icon name="enter"></orbi-icon>
                <span>ingresar</span>
            `;
            this.$userArea.appendChild(loginLink);

            this._currentAuthElement = loginLink;

            return
        }

        const openPanelBtn = document.createElement('button');
            openPanelBtn.id = 'open-panel-btn';
            openPanelBtn.setAttribute('aria-expanded', 'false');
            openPanelBtn.setAttribute('aria-controls', 'panel');
            openPanelBtn.innerHTML = `
                <img 
                    src="${user.image || 'assets/images/default-user-profile.webp'}"
                    alt="Perfil de ${user.username}"
                >
                <orbi-icon name="menu-open"></orbi-icon>
            `;
            this.$userArea.appendChild(openPanelBtn);
            
            this._currentAuthElement = openPanelBtn;
            this._currentAuthElement.addEventListener('click', this._togglePanel);
    }

    _togglePanel() {
        this._panel.toggle();
    }

    _onPanelOpened() {
        if (this._currentAuthElement && this._currentAuthElement.id === 'open-panel-btn') {
            this._currentAuthElement.setAttribute('aria-expanded', 'true');
        }
    }

    _onPanelClosed() {
        if (this._currentAuthElement && this._currentAuthElement.id === 'open-panel-btn') {
            this._currentAuthElement.setAttribute('aria-expanded', 'false');
            this._currentAuthElement.focus();
        }
    }
}

customElements.define('orbi-nav', OrbiNav);