const form = document.querySelector('form');
const email = document.querySelector('#email-input');
const password = document.querySelector('#pw-input');
const togglePwBtn = document.querySelector('#toggle-pw-btn');
const submitBtn = document.querySelector('#submit-btn');

const API = "http://api.app.test:4000";

// MENSAJES DE ERROR
const ERR_MESSAGES = {
    REQUIRED: "Este campo es requerido.",
    WHITESPACES: "No se permiten espacios en blanco.",
    INVALID_EMAIL: "Correo electrónico inválido.",
    PW_LENGTH_MIN: "La contraseña debe tener por lo menos 8 caracteres.",
    PW_LENGTH_MAX: "La contraseña no debe sobrepasar 72 caracteres.",

    EMPTY_FIELDS: "Por favor, complete todos los campos.",
    BAD_CREDENTIALS: "Verifique que el correo y/o contraseña sean correctos.",
    BAD_LOGIN: "Hubo un problema al iniciar sesión, vuelva a intentarlo.",
}
// VALIDACIONES DEL FORM
const validators = {
    email: (value) => {
        if (!value.trim())
            return ERR_MESSAGES.REQUIRED;
        if (/\s/.test(value))
            return ERR_MESSAGES.WHITESPACES;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return ERR_MESSAGES.INVALID_EMAIL;
        return "";
    },
    password: (value) => {
        if (!value.trim())
            return ERR_MESSAGES.REQUIRED;
        if (/\s/.test(value))
            return ERR_MESSAGES.WHITESPACES;
        if (value.length < 8)
            return ERR_MESSAGES.PW_LENGTH_MIN;
        if (value.length > 72)
            return ERR_MESSAGES.PW_LENGTH_MAX;
        return "";
    },
}
const fields = [email, password];

// FUNCIONES
function updateSubmitState(){
    const loading = form.querySelector('orbi-icon.loading');
    if (loading) return;

    const fieldsEmpty = !(email.value.trim() && password.value.trim());
    submitBtn.disabled = fieldsEmpty;
}
function toggleSpinner(container, isLoading, lock = []){
    let spinner = container.querySelector('orbi-icon.loading');

    if (isLoading){
        if (!spinner){
            spinner = document.createElement('orbi-icon');
            spinner.setAttribute('name', 'loading');
            spinner.classList.add('loading');
            container.append(spinner);
        }
    }
    else spinner?.remove();

    if (lock.length >= 1) lock.forEach(el => el.disabled = isLoading)
}

function handleFieldError(e){
    const { target } = e;
    const container = target.closest('.input-container');
    const name = target.name;
    const value = target.value;
    const errorMsg = validators[name](value);
    
    if (!errorMsg) clearError(container);

    updateSubmitState();
}
function showError(container, message){
    let error = container.querySelector('orbi-error');
    if (!error){
        error = document.createElement('orbi-error');
        container.appendChild(error);
    }

    container.classList.add('error');
    error.setAttribute('message', message);

    if (container === form) error.setAttribute('no-bg', '')
}
function clearError(container){
    container.classList.remove('error');
    const error = container.querySelector('orbi-error');
    if (error) error.remove();
}

function disableWhitespace(e){
    const whitespaces = [32, 160, 5760, 8192, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288];
    const key = e.keyCode;

    if (whitespaces.includes(key)) e.preventDefault();
}

async function loginAccount(email, password){
    const data = {
        email: email,
        password: password,
        next: new URLSearchParams(window.location.search).get("next") || ""
    }

    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(data)
    })
    const body = await res.json();

    return { status: res.status, body: body };
}

// EVENTOS
togglePwBtn.addEventListener('click', () => {
    const isHidden = password.type === 'password';
    password.type = isHidden ? 'text'
                             : 'password';
    
    togglePwBtn.querySelector('orbi-icon')
               .setAttribute('name', isHidden ? 'hide' : 'show');
})

fields.forEach(field => {
    field.addEventListener('keypress', disableWhitespace);
    field.addEventListener('input', handleFieldError);
})

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formError = form.classList.contains('error');
    if (formError) clearError(form);

    const emailErr = validators.email(email.value);
    const passwordErr = validators.password(password.value);

    if (emailErr && passwordErr === ERR_MESSAGES.REQUIRED){
        updateSubmitState();
        return showError(form, ERR_MESSAGES.EMPTY_FIELDS);
    }
    
    if (emailErr || passwordErr){
        updateSubmitState();
        if (emailErr) showError(email.closest('.input-container'), emailErr);
        if (passwordErr) showError(password.closest('.input-container'), passwordErr);
        return;
    }

    const controls = [email, password, togglePwBtn, submitBtn];
    toggleSpinner(submitBtn, true, controls);

    try{
        const { status, body } = await loginAccount(email.value, password.value);

        if (status !== 201){
            toggleSpinner(submitBtn, false, controls);

            if (body.not_found) return showError(form, ERR_MESSAGES.BAD_CREDENTIALS);

            return showError(form, ERR_MESSAGES.BAD_LOGIN);
        }
        toggleSpinner(submitBtn, false);
        window.location.href = body.redirect || "/";
    }
    catch{
        toggleSpinner(submitBtn, false, controls);
        return showError(form, ERR_MESSAGES.BAD_LOGIN);
    }
})