const errorElem = `
    <span class="error-message"></span>
`;
const errorStyle = `
    :host{
        width: 100%;

        display: block;
        font-size: 0.7rem;
        font-weight: 400;

        box-sizing: border-box;
        z-index: 100;
    }
    :host([no-bg]) .error-message{
        background-color: transparent;
        color: var(--color-pale-red);
    }
    .error-message{
        padding: 0.3rem 0.2rem;
        border-radius: 0 0 5px 5px;

        font-family: var(--font-legible);
        font-size: inherit;
        font-weight: inherit;
        text-wrap: balance;
        text-align: center;

        display: block;

        background-color: var(--color-pale-red);
        color: var(--color-red);
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${errorStyle}</style>
    ${errorElem}
`;

class OrbitaErrorMessage extends HTMLElement{
    static get observedAttributes(){
        return ['message', 'no-bg'];
    }

    constructor(){
        super();
        
        const content = template.content.cloneNode(true);
        
        this.attachShadow({mode: 'open'})
            .appendChild(content);

        this._span = this.shadowRoot.querySelector('.error-message')
    }

    connectedCallback(){
        if (this.hasAttribute('message')){
            const msg = this.getAttribute('message')
            this._span.textContent = msg;
        }
    }

    attributeChangedCallback(attr, _, value){
        if (attr === 'message') this._span.textContent = value || '';
    }
}

customElements.define('orbi-error', OrbitaErrorMessage);