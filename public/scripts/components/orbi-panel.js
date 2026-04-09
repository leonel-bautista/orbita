import { logout } from "../client.js";

const panel = `
    <div class="overlay"></div>
    <aside id="panel" role="dialog" aria-modal="true" aria-hidden="true">
        <header id="panel-header">
            <img id="user-avatar" src="" alt="Perfil">
            <div class="user-info-container">
                <span id="user-tier"></span>
                <span id="user-name"></span>
            </div>
            <button id="close-panel-btn" aria-controls="panel">
                <orbi-icon name="menu-close"></orbi-icon>
            </button>
        </header>

        <ul id="options-area">
            <li><a href="" class="aside-links" id="account-link">
                <orbi-icon name="user"></orbi-icon>
                <span>VER CUENTA</span>
            </a></li>
            <li><a href="soporte" class="aside-links" id="support-link">
                <orbi-icon name="support"></orbi-icon>
                <span>SOPORTE</span>
            </a></li>
            <li><button class="aside-links" id="logout-btn">
                <orbi-icon name="exit"></orbi-icon>
                <span>SALIR</span>
            </button></li>
        </ul>
    </aside>
`;
const panelStyle = `
    :host{
        z-index: 1500;
    }

    .overlay {
        position: fixed;
        inset: 0;
        background-color: oklch(from var(--color-text-alt) l c h / 85%);
        z-index: 1500;
        opacity: 0;
        visibility: hidden;
        transition: opacity 300ms ease, visibility 300ms ease;
    }
    .overlay.open {
        opacity: 1;
        visibility: visible;
    }

    #panel {
        width: clamp(320px, 25vw, 450px);
        height: 100vh;
        position: fixed;
        top: 0;
        right: 0;
        translate: 120% 0;
        transition: translate 300ms ease;
        z-index: 2000;
        overflow: hidden;
        display: grid;
        grid-template-rows: auto 1fr;
        background-color: var(--color-bg-dark);
    }
    #panel.open {
        translate: 0 0;
    }

    #panel header {
        padding: 2rem 1rem;
        display: flex;
        position: relative;
        gap: 1em;
        background: var(--color-secondary-900);

        #user-avatar {
            height: 3.5rem;
            aspect-ratio: 1 / 1;
            border-radius: .25rem;
            border: 2px solid var(--color-text);
            object-fit: cover;
            object-position: center;
        }

        .user-info-container {
            flex: 1;
            display: grid;

            #user-tier {
                background: var(--color-text-muted);
                width: fit-content;
                height: fit-content;
                align-self: start;
                font-size: .7rem;
                font-weight: 800;
                border-radius: .2em;
                padding: .1em .5em;
                cursor: default;
            }
            #user-name {
                align-self: start;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-family: var(--font-title);
                font-size: 1.1rem;
            }
        }

        #close-panel-btn {
            aspect-ratio: 1 / 1;
            height: 100%;
            cursor: pointer;
            border: none;
            padding: .5rem;
            display: block;
            place-content: center;
            border-radius: .25rem;
            background: transparent;
            color: var(--color-text);

            &:hover, &:focus-visible{
                box-shadow: 0 0 0 2px var(--color-tertiary-900);
            }
        }
    }

    #panel #options-area {
        list-style: none;
        display: flex;
        flex-direction: column;
        padding: 1rem 0;
        margin: 0;
        background: var(--color-secondary-800);

        .aside-links{
            display: flex;
            align-items: center;
            justify-content: center;
            height: 70px;
            gap: .5rem;
            padding: .5rem 2rem;
            font-size: .9rem;
            font-weight: 500;
            text-decoration: none;
            color: var(--color-text);
            background: transparent;
            border: none;
            width: 100%;
            box-sizing: border-box;
            cursor: pointer;
            font-family: var(--font-title);

            &:hover, &:focus-visible{
                background: var(--color-secondary-900);
                color: var(--color-tertiary-900);
            }
        }
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${panelStyle}</style>
    ${panel}
`;

class OrbiPanel extends HTMLElement {
    constructor(){
        super();

        const content = template.content.cloneNode(true);

        this.attachShadow({ mode: 'open' })
            .appendChild(content);

        this._overlay = this.shadowRoot.querySelector('.overlay');
        this._aside = this.shadowRoot.querySelector('#panel');

        this._userAvatar = this.shadowRoot.querySelector('#user-avatar');
        this._userTier = this.shadowRoot.querySelector('#user-tier');
        this._userName = this.shadowRoot.querySelector('#user-name');
        this._accountLink = this.shadowRoot.querySelector('#account-link');
        
        this._onUser = this._onUser.bind(this);
        this._closeBtn = this.shadowRoot.querySelector('#close-panel-btn');
        this._onToggle = this.toggle.bind(this);

        this._logoutBtn = this.shadowRoot.querySelector('#logout-btn');
        this._onLogout = this._onLogout.bind(this);
    }

    connectedCallback(){
        document.addEventListener("user-loaded", this._onUser);

        this._overlay.addEventListener("click", this._onToggle);
        this._closeBtn.addEventListener("click", this._onToggle);
        this._logoutBtn?.addEventListener("click", this._onLogout);
    }

    disconnectedCallback(){
        document.removeEventListener("user-loaded", this._onUser);

        this._overlay.removeEventListener("click", this._onToggle);
        this._closeBtn.removeEventListener("click", this._onToggle);
        this._logoutBtn?.removeEventListener("click", this._onLogout);
    }

    _onUser(e) {
        const user = e.detail;

        if (!user) {
            this._aside.classList.remove('open');
            this._overlay.classList.remove('open');
            this._aside.setAttribute('aria-hidden', 'true');

            this._userAvatar.src = 'assets/images/default-user-profile.webp';
            this._userAvatar.alt = 'Perfil';
            this._userTier.textContent = 'Base';
            this._userAlias.textContent = 'user';
            this._accountLink.href = 'login';

            return
        }

        this._userAvatar.src = user.image || 'assets/images/default-user-profile.webp';
        this._userAvatar.alt = `Perfil de ${user.username}`;
        this._userTier.textContent = user.tier;
        this._userName.textContent = user.username;
        this._accountLink.href = 'cuenta';

        if (user.isAdmin) {
            const optionsArea = this.shadowRoot.querySelector('#options-area');
            const dashboardLink = document.createElement('a');
            dashboardLink.href = 'https://leonel.alwaysdata.net/orbita/admin';
            dashboardLink.className = "aside-links";
            dashboardLink.innerHTML = `
                <orbi-icon name="dashboard"></orbi-icon>
                <span>DASHBOARD</span>
            `;
            const lastLink = optionsArea.lastElementChild
            optionsArea.insertBefore(dashboardLink, lastLink);
        }
    }

    async _onLogout() {
        await logout();
        document.dispatchEvent(
            new CustomEvent("user-loaded", { detail: null })
        );
        window.location.href = '.';
    }

    toggle() {
        const isOpening = !this._aside.classList.contains("open");

        if (!isOpening) {
            this._closeBtn.blur();
        }

        this._aside.classList.toggle("open", isOpening);
        this._overlay.classList.toggle("open", isOpening);
        this._aside.setAttribute("aria-hidden", String(!isOpening));

        this.dispatchEvent(new CustomEvent(
            isOpening ? "panel-opened" : "panel-closed",
            { bubbles: true, composed: true }
        ));
    }
}

customElements.define("orbi-panel", OrbiPanel);