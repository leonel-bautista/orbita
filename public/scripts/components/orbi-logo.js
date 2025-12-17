const logoStyle = `
    :host {
        width: auto;
        height: 40px;
        display: inline-block;
        aspect-ratio: 480 / 129;
        font-family: var(--font-title);

        --fill-planet: var(--color-text);
        --fill-text: var(--color-text);
        --fill-trail: var(--color-text-muted);

        stroke-width: 2px;
        --stroke-planet: none;
        --stroke-text: none;
        --stroke-trail: none;

        --filter-planet: none;
        --filter-text: none;
        --filter-trail: none;
    }
    svg {
        width: 100%;
        height: 100%;

        display: block;
        overflow: visible;
    }
    #planet {
        fill: var(--fill-planet);
        stroke: var(--stroke-planet);
        filter: var(--filter-planet);
    }
    #text {
        fill: var(--fill-text);
        stroke: var(--stroke-text);
        filter: var(--filter-text);
    }
    #trail {
        fill: var(--fill-trail);
        stroke: var(--stroke-trail);
        filter: var(--filter-trail);

        mask-image: linear-gradient(to right, black 20%, transparent 100%);
        -webkit-mask-image: linear-gradient(to right, black 20%, transparent 100%);
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${logoStyle}</style>
    <span id="root"></span>
`;

export class OrbitaLogo extends HTMLElement {
    constructor() {
        super();

        const content = template.content.cloneNode(true);

        this.attachShadow({ mode: 'open' })
            .appendChild(content);

        this._root = this.shadowRoot.querySelector('#root')
    }

    async connectedCallback() {
        try {
            const res = await fetch('/assets/logo.svg');
            if (!res.ok) throw new Error('No se pudo cargar el logo svg');
            const logo = await res.text();
            this._root.innerHTML = logo;
        } catch (error) {
            console.error(error);
            this._root.textContent = 'Órbita';
        }
    }
}

customElements.define('orbi-logo', OrbitaLogo);