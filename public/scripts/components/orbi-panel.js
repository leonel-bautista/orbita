import { logout } from "../client.js";

const panel = `
    <div class="overlay"></div>
    <aside id="panel" role="dialog" aria-modal="true" aria-hidden="true">
        <header id="panel-header">
            <img id="user-avatar" src="/assets/images/default-user-profile.webp" alt="Perfil">
            <div class="user-info-container">
                <span id="user-tier">Base</span>
                <span id="user-alias">user</span>
            </div>
            <button id="close-panel-btn" aria-controls="panel">
                <orbi-icon name="menu-close"></orbi-icon>
            </button>
        </header>

        <ul id="options-area">
            <li><a href="" class="aside-links" id="profile-link">
                <orbi-icon name="user"></orbi-icon>
                <span>PERFIL</span>
            </a></li>
            <li><a href="/help" class="aside-links" id="support-link">
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
    .overlay{
        position: fixed;
        inset: 0;
        background: rgba(var(--rgb-black), 0.7);
        z-index: 1500;
        opacity: 0;
        visibility: hidden;
        transition: opacity 300ms ease, visibility 300ms ease;
    }
    .overlay.open{
        opacity: 1;
        visibility: visible;
    }

    #panel{
        width: clamp(320px, 25vw, 450px);
        height: 100vh;
        position: fixed;
        top: 0;
        right: 0;
        translate: 120% 0;
        transition: translate 300ms ease;
        z-index: 2000;

        background:
            radial-gradient(circle 550px at top left, var(--color-dark-blue), transparent),
            radial-gradient(circle at top left, var(--color-dark-cyan), transparent), linear-gradient(70deg, rgba(var(--rgb-black), 0.4), transparent);
        border-left: 0.2rem inset rgba(var(--rgb-black), 0.7);
        box-shadow: 0 1px 0.8rem rgba(var(--rgb-black), 0.5);
        overflow: hidden;
        display: grid;
        grid-template-rows: auto 1fr;
        backdrop-filter: blur(10px);
    }
    #panel.open{
        translate: 0 0;
    }

    #panel header{
        padding: 2rem 1rem;
        display: flex;
        position: relative;
        box-shadow: 0 1rem 0.8rem -1rem rgba(var(--rgb-black), 0.5);
        background: radial-gradient(
            ellipse at top left,
            rgba(var(--rgb-black), 0.2) 40%,
            rgba(var(--rgb-black), 0.5));
        gap: 0.5em;

        img{
            height: 3rem;
            aspect-ratio: 1 / 1;
            border-radius: 0.25rem;
            border: 2px solid var(--color-pale-cyan);
            box-shadow: 0 0 1rem 1px rgba(var(--rgb-black), 0.3);
        }

        .user-info-container{
            flex: 1;
            display: grid;

            #user-tier{
                background: gray;
                width: fit-content;
                height: fit-content;
                align-self: start;
                font-size: 0.7rem;
                font-weight: 600;
                border-radius: 0.2em;
                padding: 0.1em 0.5em;
                cursor: default;
            }
            #user-alias{
                align-self: start;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        #close-panel-btn{
            cursor: pointer;
            border: none;
            color: var(--color-gray);
            background: rgba(var(--rgb-white), 0.05);
            padding: 0 0.5rem;
            display: block;
            place-content: center;
            box-shadow: 1px 1px 0.3rem rgba(var(--rgb-black), 0.2);
            border-radius: 0.25rem;

            &:hover, &:focus-visible{
                background: rgba(var(--rgb-white), 0.1);
                orbi-icon{ color: var(--color-pale-cyan); }
            }
        }
    }

    #panel #options-area{
        list-style: none;
        display: flex;
        flex-direction: column;
        padding: 1rem 0;

        .aside-links{
            display: flex;
            align-items: center;
            justify-content: center;
            height: 70px;
            gap: 0.5rem;
            padding: 0.5rem 2rem;
            font-size: 0.9rem;
            font-weight: 700;
            text-decoration: none;
            color: var(--color-gray);
            box-shadow: 0 1rem 0.5rem -1rem rgba(var(--rgb-black), 0.3);
            background: transparent;
            border: none;
            width: 100%;
            box-sizing: border-box;
            cursor: pointer;
            font-family: var(--font-default);

            &:hover, &:focus-visible{
                background: rgba(var(--rgb-black), 0.2);
                color: var(--color-pale-cyan);
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
        
        this.attachShadow({mode: 'open'})
            .appendChild(content);

        this._overlay = this.shadowRoot.querySelector('.overlay');
        this._aside = this.shadowRoot.querySelector('#panel');

        this._userAvatar = this.shadowRoot.querySelector('#user-avatar');
        this._userTier = this.shadowRoot.querySelector('#user-tier');
        this._userAlias = this.shadowRoot.querySelector('#user-alias');
        this._profileLink = this.shadowRoot.querySelector('#profile-link');
        
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

    _onUser(event) {
        const user = event.detail;

         if (!user) {
            this._aside.classList.remove('open');
            this._overlay.classList.remove('open');
            this._aside.setAttribute('aria-hidden', 'true');

            this._userAvatar.src = '/assets/images/default-user-profile.webp';
            this._userAvatar.alt = 'Perfil';
            this._userTier.textContent = 'Base';
            this._userAlias.textContent = 'user';
            this._profileLink.href = '/login';

            return;
        }

        this._userAvatar.src = user.image || '/assets/images/default-user-profile.webp';
        this._userAvatar.alt = `Perfil de ${user.alias}`;
        this._userTier.textContent = user.tier;
        this._userAlias.textContent = user.alias;
        this._profileLink.href = `/profile/${user.id}`;
    }

    async _onLogout() {
        await logout();
        document.dispatchEvent(
            new CustomEvent("user-loaded", { detail: null })
        );
        window.location.reload();
    }

    toggle(){
        const isOpening = !this._aside.classList.contains("open");

        if (!isOpening) {
            this._closeBtn.blur();
        }

        this._aside.classList.toggle("open",  isOpening);
        this._overlay.classList.toggle("open", isOpening);
        this._aside.setAttribute("aria-hidden", String(!isOpening));

        this.dispatchEvent(new CustomEvent(
            isOpening ? "panel-opened" : "panel-closed",
            { bubbles: true, composed: true }
        ));
    }
}

customElements.define("orbi-panel", OrbiPanel);