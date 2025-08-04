const navbar = `
    <nav>
        <div id="logo-area">
            <a href="/" class="nav-links" id="home-link">
                <orbi-logo></orbi-logo>
            </a>
        </div>

        <ul id="pages-area">
            <li><a href="/games" class="nav-links" id="games-link">JUEGOS</a></li>
            <li><a href="/downloads" class="nav-links" id="downloads-link">DESCARGAS</a></li>
            <li><a href="/news" class="nav-links" id="news-link">NOVEDADES</a></li>
            <li><a href="/about" class="nav-links" id="news-link">ACERCA DE</a></li>
        </ul>

        <div id="user-area">
        </div>
    </nav>
`;
const navStyle = `
    nav{
        height: 70px;
        display: flex;
        background: radial-gradient(
            circle 100dvw at center right,
            rgba(var(--rgb-black), 0.6),
            rgba(var(--rgb-black), 0.3));
        z-index: 1000;
        align-items: center;
        box-shadow: 0 1px 0.8rem rgba(var(--rgb-black), 0.5);
        border-bottom: 0.2rem outset rgba(var(--rgb-black), 0.2);
        gap: 1.5rem;
        padding: 0 1.5rem;
        position: relative;
        backdrop-filter: blur(10px);

        > *{
            height: 100%;
            place-content: center;
        }

        .nav-links{
            text-decoration: none;
            color: var(--color-gray);
            font-weight: 600;
            font-size: 0.9rem;
            transition: color 150ms ease, background-color 150ms ease;
        }
    }
    nav #logo-area{
        #home-link{
            padding: 0.9rem 0.7rem;
            display: block;

            &:hover, &:focus-visible{
                orbi-logo{
                    filter: drop-shadow(0.1rem .1rem 2px rgba(var(--rgb-white), 0.25));
                    --fill-planet: var(--color-light-cyan);
                    --fill-letters: var(--color-pale-cyan);
                }
            }
        }
        orbi-logo{
            height: 30px;
            transition: fill 150ms ease;
        }
    }
    nav #pages-area{
        height: 100%;
        width: 100%;
        flex: 1;
        display: inline-flex;
        list-style: none;
        font-weight: 500;
        justify-content: flex-end;
        align-items: center;
        gap: 1.5rem;

        .nav-links:hover, .nav-links:focus-visible{
            color: var(--color-pale-cyan);
            font-weight: 700;
            translate: 0 10%;
        }
        li{ transition: translate 150ms ease; }
        li:has(.nav-links:hover, .nav-links:focus-visible){ translate: 0 -0.1rem; }
    }
    nav #user-area:has(#login-link){
        #login-link{
            min-width: 100px;
            padding: 0.7rem 1rem;
            border-radius: 0.2em;
            box-shadow: inset 0 0 0 0.05rem var(--color-darker-gray);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.2rem;

            background: radial-gradient(
                circle at top left,
                transparent 35%,
                var(--color-light-cyan),
                var(--color-pale-cyan));
            background-size: 350% 350%;
            background-position: 0%;

            transition: background-position 150ms ease-in-out, color 150ms ease-in-out;

            &:hover, &:focus-visible{
                font-weight: 600;
                color: var(--color-white);
                box-shadow: none;
                background-position: 100%;

                orbi-icon, span{ filter: drop-shadow(1px 1px 1px var(--color-dark-gray)); }
            }
        }
        orbi-icon{ height: 1rem; }
    }
    nav #user-area:has(img){
        #open-panel-btn{
            border: none;
            display: flex;
            align-items: center;

            padding: 0.5rem 1rem;
            padding-right: 0.5rem;
            border-radius: 0.2rem;
            cursor: pointer;
            gap: 0.5rem;

            z-index: 5000;
            
            background: rgba(var(--rgb-white), 0.05);
    
            &:hover, &:focus-visible{
                background: rgba(var(--rgb-white), 0.1);

                orbi-icon{ color: var(--color-pale-cyan); }
                img{ border-color: var(--color-pale-cyan); }
            }

            img{
                height: 2rem;
                aspect-ratio: 1 / 1;
                border-radius: 0.25rem;
                border: 2px solid var(--color-gray);
                box-shadow: 0 0 3px 1px rgba(var(--rgb-black), .3);
            }
            orbi-icon{
                color: var(--color-gray);
                height: 1.5rem;
            }
        }
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${navStyle}</style>
    ${navbar}
`;

class OrbiNav extends HTMLElement{
    constructor(){
        super();
        
        const content = template.content.cloneNode(true);
        
        this.attachShadow({mode: 'open'})
            .appendChild(content);
        
        this.$userArea = this.shadowRoot.querySelector('#user-area');

        this._onUser = this._onUser.bind(this);
        this._togglePanel = this._togglePanel.bind(this);
        this._onPanelOpened = this._onPanelOpened.bind(this);
        this._onPanelClosed = this._onPanelClosed.bind(this);

        this._currentAuthElement = null;
        this._panel = null;
    }

    connectedCallback(){
        document.addEventListener('user-loaded', this._onUser);

        this._panel = document.querySelector('orbi-panel');

        if (this._panel){
            this._panel.addEventListener('panel-opened', this._onPanelOpened);
            this._panel.addEventListener('panel-closed', this._onPanelClosed);
        }
    }
    disconnectedCallback(){
        document.removeEventListener('user-loaded', this._onUser);

        if (this._panel){
            this._panel.removeEventListener('panel-opened', this._onPanelOpened);
            this._panel.removeEventListener('panel-closed', this._onPanelClosed);
        }

        if (this._currentAuthElement){
            if (this._currentAuthElement.id === 'open-panel-btn') {
                this._currentAuthElement.removeEventListener('click', this._togglePanel);
            }
        }
    }

    _onUser(e){
        const user = e.detail;

        if (this._currentAuthElement && this._currentAuthElement.id === 'open-panel-btn') {
            this._currentAuthElement.removeEventListener('click', this._togglePanel);
        }

        this.$userArea.innerHTML = '';

        if (user){
            const openPanelBtn = document.createElement('button');
            openPanelBtn.id = 'open-panel-btn';
            openPanelBtn.setAttribute('aria-expanded', 'false');
            openPanelBtn.setAttribute('aria-controls', 'panel');
            openPanelBtn.innerHTML = `
                <img 
                    src="${user.image || '/assets/images/default-user-profile.webp'}"
                    alt="Perfil"
                >
                <orbi-icon name="menu-open"></orbi-icon>
            `;
            this.$userArea.appendChild(openPanelBtn);
            
            this._currentAuthElement = openPanelBtn;
            this._currentAuthElement.addEventListener('click', this._togglePanel);
            
        } else{
            const loginLink = document.createElement('a');
            loginLink.href = `/login?next=${encodeURIComponent(location.pathname)}`;
            loginLink.id = 'login-link';
            loginLink.className = 'nav-links';
            loginLink.innerHTML = `
                <orbi-icon name="enter"></orbi-icon>
                <span>INGRESAR</span>
            `;
            this.$userArea.appendChild(loginLink);
            
            this._currentAuthElement = loginLink;
        }
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