const icon = `
    <svg aria-hidden="true">
        <use></use>
    </svg>
`;
const iconStyle = `
    :host{
        width: auto;
        height: 1.5rem;
        display: inline-block;
        aspect-ratio: 1 / 1;

        color: inherit;
        pointer-events: none;
    }
    svg{
        width: 100%;
        height: 100%;

        display: block;

        fill: currentColor;
        stroke: currentColor;
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${iconStyle}</style>
    ${icon}
`;

class OrbitaIcon extends HTMLElement{
    static get observedAttributes(){
        return ['name'];
    }

    constructor(){
        super();
        
        const content = template.content.cloneNode(true);
        
        this.attachShadow({mode: 'open'})
            .appendChild(content);

        this._use = this.shadowRoot.querySelector('use');
    }

    connectedCallback(){
        const name = this.getAttribute('name')
        this._updateIcon(name);
    }

    attributeChangedCallback(attr, _, value){
        if (attr === 'name') this._updateIcon(value);
    }

    _updateIcon(name){
        if (!name) return this._use.setAttribute('href', '');
        this._use.setAttribute('href', `/assets/sprite.svg#${name}`);
    }
}

customElements.define('orbi-icon', OrbitaIcon);