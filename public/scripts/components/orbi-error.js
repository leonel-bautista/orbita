const errorStyle = `
    :host{
        width: 100%;

        display: block;
        font-size: .7rem;
        font-weight: 500;

        box-sizing: border-box;
        z-index: 100;
    }
    :host([no-bg]) .error-message{
        background-color: transparent;
        color: var(--color-error);
    }
    .error-message{
        padding: .3em .2em;
        border-radius: 0 0 .2em .2em;
        cursor: default;

        font-family: var(--font-text);
        font-size: inherit;
        font-weight: inherit;
        text-wrap: balance;
        text-align: center;

        display: block;

        background-color: var(--color-error);
        color: var(--color-text-alt);
    }
`;
const template = document.createElement('template');
template.innerHTML = `
    <style>${errorStyle}</style>
    <span class="error-message"></span>
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