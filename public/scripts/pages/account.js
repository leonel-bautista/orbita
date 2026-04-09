import { findUserBy, getActiveGames, updateAccount } from "../client.js";

const dialog = document.querySelector('#account-dialog');
const form = dialog.querySelector('form');

let currentUser = null;

const renderView = {
    profile: () => loadProfileView(),
    sync: () => {},
    libraries: () => loadLibrariesView()
}
const ERR_MESSAGES = {
    IMAGE_OVERSIZE: "El tamaño de la imágen no debe sobrepasar 1MB.",
    IMAGE_TYPE: "El formato de la imágen debe ser PNG, JPG, JPEG o WEBP.",
    NAME_TAKEN: "El nombre de usuario ya está en uso.",
    NAME_MATCHING: "El nombre de usuario no puede ser el mismo que el anterior.",
    PW_LENGTH_MIN: "La contraseña debe tener por lo menos 8 caracteres.",
    PW_LENGTH_MAX: "La contraseña no debe sobrepasar 72 caracteres.",
    PW_DIFFERENCE: "Las contraseñas no coinciden.",

    REQUIRED: "Este campo es requerido.",
    WHITESPACES: "No se permiten espacios en blanco.",
    EMPTY_FIELDS: "Por favor, complete todos los campos.",
}
const validators = {
    image: (value) => {
        if (!value)
            return ERR_MESSAGES.REQUIRED;
        if (value.size > 1 * 1024 * 1024)
            return ERR_MESSAGES.IMAGE_OVERSIZE;
        const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(value.type))
            return ERR_MESSAGES.IMAGE_TYPE;
        return "";
    },
    username: async (value) => {
        if (!value.trim())
            return ERR_MESSAGES.REQUIRED;
        if (/\s/.test(value))
            return ERR_MESSAGES.WHITESPACES;
        if (value === currentUser.username)
            return ERR_MESSAGES.NAME_MATCHING;
        const userExists = await checkUsername(value);
        if (userExists)
            return ERR_MESSAGES.NAME_TAKEN;
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
    confirmPassword: (value, pwValue) => {
        if (!value.trim())
            return ERR_MESSAGES.REQUIRED;
        if (/\s/.test(value))
            return ERR_MESSAGES.WHITESPACES;
        if (value !== pwValue)
            return ERR_MESSAGES.PW_DIFFERENCE;
        return "";
    }
}

function showError(container, message) {
    let error = container.querySelector('orbi-error');
    if (!error){
        error = document.createElement('orbi-error');
        container.appendChild(error);
    }

    container.classList.add('error');
    error.setAttribute('message', message);

    if (container === form) error.setAttribute('no-bg', '')
}
function clearError(container) {
    container.classList.remove('error');
    const error = container.querySelector('orbi-error');
    if (error) error.remove();
}
async function handleFieldError(event) {
    const input = event.target;
    const container = input.closest('.input-container');
    const field = input.name;
    const value = field === 'image' ? input.files[0] : input.value;
    const altPwInput = field === 'confirmPassword' ? form.querySelector('input[name="password"]') : null;
    const errorMsg = await validators[field](value, altPwInput?.value);

    if (event.type === 'input' && !errorMsg) clearError(container);
    else if ((event.type === 'blur' || event.type === 'change') && errorMsg) showError(container, errorMsg);
    else if (!errorMsg) clearError(container);
}

function usernameExistenceChecker() {
    let lastValue = "";
    let lastChecked = false;
    let controller = null;

    return async function(value) {
        if (value === lastValue) return lastChecked;

        lastValue = value;
        controller?.abort();
        controller = new AbortController();

        try {
            const res = await findUserBy('username', value);
            res.ok ? lastChecked = res.body.exists
                   : lastChecked = false;
        } catch (error) {
            if (error.name !== 'AbortError') lastChecked = false;
        }

        return lastChecked;
    }
}
const checkUsername = usernameExistenceChecker();

function handleImagePreview(input, preview) {
    const file = input.files[0];

    const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];

    if (!file || !allowedTypes.includes(file.type)) {
        preview.src = '';
        preview.style.display = 'none';
        return;
    }

    const imageUrl = URL.createObjectURL(file);
    preview.src = imageUrl;
    preview.style.display = 'block';
}

function disableWhitespace(event) {
    const whitespaces = [32, 160, 5760, 8192, 8194, 8195, 8196, 8197, 8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288];
    const key = event.keyCode;

    if (whitespaces.includes(key)) event.preventDefault();
}

function setupBtns() {
    const editBtns = document.querySelectorAll('.edit-btn');

    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.field;
            openDialog(field);
        });
    });
}

function setupForm() {
    form?.addEventListener('submit', handleSubmit);

    const cancelBtn = form.querySelector('#cancel-btn');
    cancelBtn?.addEventListener('click', () => dialog.close());
}

function loadProfileView() {
    const image = document.querySelector('#image');
    const username = document.querySelector('#username');
    const email = document.querySelector('#email');
    const tier = document.querySelector('#tier');

    document.addEventListener('user-loaded', (e) => {
        const user = e.detail;
        if (!user) return;

        document.title = `Órbita ⪼ ${user.username}`;
        image.src = user.image || 'uploads/users/u-default.png';
        username.textContent = user.username || '-';
        email.textContent = user.email || '-';
        tier.textContent = user.tier || '-';

        currentUser = user;
    });

    setupBtns();
    setupForm();
}

async function loadLibrariesView() {
    const librariesContainer = document.querySelector('#libraries-view');
    if (!librariesContainer) return;

    const res = await getActiveGames();
    const gamesList = res && res.ok ? res.body : [];

    if (gamesList.length === 0) {
        librariesContainer.innerHTML = '<p>No se encontraron juegos en tu biblioteca.</p>';
        return;
    }

    const list = document.createElement('ul');
    list.className = 'games-list';
    
    gamesList.forEach(game => {
        const item = document.createElement('li');
        item.className = 'listed-game';

        const link = document.createElement('a');
        link.href = `juegos/${game.id}`;

        const image = document.createElement('img');
        image.src = game.image || 'uploads/games/g-default.png';
        image.alt = game.name;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = game.name || '-';

        link.appendChild(image);
        link.appendChild(name);
        item.appendChild(link);
        list.appendChild(item);
    })

    librariesContainer.innerHTML = '<h2>Mi Biblioteca</h2>';
    librariesContainer.appendChild(list);
}

function setupDialog(field) {
    const dialogTitle = dialog.querySelector('#dialog-title');
    const dialogBody = dialog.querySelector('#dialog-body');

    dialogTitle.textContent = '';
    dialogBody.innerHTML = '';

    switch (field) {
        case 'image':
            dialogTitle.textContent = 'Cambiar foto de perfil';
            dialogBody.innerHTML = `
                <div class="image-compare">
                    <div class="image-preview">
                        <img id="current-image-preview" src="${currentUser.image || 'uploads/users/u-default.png'}" alt="Imágen actual">
                    </div>
                    <div class="image-preview">
                        <img id="new-image-preview" src="" alt="Imágen nueva">
                    </div>
                </div>
                <div class="input-container">
                    <input type="file" id="image-input" name="image">
                </div>
            `;
            {
                const imageInput = dialogBody.querySelector('#image-input');
                const newImagePreview = dialogBody.querySelector('#new-image-preview');
                if (!imageInput && !newImagePreview) return;

                imageInput.addEventListener('change', (e) => {
                    handleFieldError(e);
                    handleImagePreview(imageInput, newImagePreview);
                });
            }
            break;
        case 'user':
            dialogTitle.textContent = 'Cambiar nombre de usuario';
            dialogBody.innerHTML = `
                <div class="input-container">
                    <label for="username-input">Nombre de usuario</label>
                    <input type="text" id="username-input" name="username" value="${currentUser.username}" placeholder="">
                </div>
            `;
            {
                const userInput = dialogBody.querySelector('#username-input');
                userInput?.addEventListener('keypress', disableWhitespace);
                userInput?.addEventListener('input', handleFieldError);
                userInput?.addEventListener('blur', handleFieldError)
            }
            break;
        case 'password':
            dialogTitle.textContent = 'Cambiar contraseña';
            dialogBody.innerHTML = `
                <div class="input-container">
                    <label for="password-input">Nueva contraseña</label>
                    <input type="password" id="password-input" name="password" placeholder="">
                    <div class="btn-container">
                        <button type="button" class="toggle-pw-btn">
                            <orbi-icon name="show"></orbi-icon>
                        </button>
                    </div>
                </div>
                <div class="input-container">
                    <label for="confirmPassword-input">Confirmar contraseña</label>
                    <input type="password" id="confirmPassword-input" name="confirmPassword" placeholder="">
                    <div class="btn-container">
                        <button type="button" class="toggle-pw-btn">
                            <orbi-icon name="show"></orbi-icon>
                        </button>
                    </div>
                </div>
            `;
            {
                const pwInputs = dialogBody.querySelectorAll('input[type="password"]');
                pwInputs.forEach(input => {
                    input.addEventListener('keypress', disableWhitespace);
                    input.addEventListener('input', handleFieldError);
                    input.addEventListener('blur', handleFieldError);

                    const toggleBtn = input.closest('.input-container').querySelector('.toggle-pw-btn');
                    toggleBtn?.addEventListener('click', () => {
                        const isHidden = input.type === 'password';
                        input.type = isHidden ? 'text' : 'password';

                        toggleBtn.querySelector('orbi-icon')
                                 .setAttribute('name', isHidden ? 'hide' : 'show');
                    })
                })
            }
            break;
        default:
            return;
    }
}

function openDialog(field) {
    if (!currentUser) return;

    setupDialog(field);
    dialog?.showModal();
}

async function handleSubmit(event) {
    event.preventDefault();
    form.querySelectorAll('orbi-error')?.forEach(error => clearError(error.closest('.input-container') || form));

    const id = currentUser.id;
    const formData = new FormData();

    const formInputs = form.querySelectorAll('input');
    await Promise.all(Array.from(formInputs).map(async (input) => {
        const field = input.name;
        const value = field === 'image' ? input.files[0] : input.value;
        const container = input.closest('.input-container');
        const altPwInput = field === 'confirmPassword' ? form.querySelector('input[name="password"]') : null;

        const errorMsg = await validators[field](value, altPwInput?.value);
        if (errorMsg) showError(container, errorMsg);

        if (altPwInput || errorMsg) return;

        formData.append(field, value);
    }));

    const hasErrors = form.querySelectorAll('orbi-error').length > 0;
    if (hasErrors) return;

    updateAccount(id, formData);

    window.location.reload();
}

function setupSidebar() {
    const links = document.querySelectorAll('#account-sidebar a');
    const views = document.querySelectorAll('.content-view');
    const defaultView = document.querySelector('#profile-view');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            links.forEach(link => link.classList.remove('active'));
            link.classList.add('active');

            views.forEach(view => view.classList.add('hidden'));

            const viewName = link.dataset.view;
            const target = document.querySelector(`#${viewName}-view`);
            target.classList.remove('hidden');

            renderView[viewName]();
        })
    })

    const activeLink = document.querySelector('#account-sidebar a.active');
    if (activeLink) activeLink.click();
    else if (defaultView) {
        defaultView.classList.remove('hidden');
        renderView.profile();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfileView();
    setupSidebar();
})