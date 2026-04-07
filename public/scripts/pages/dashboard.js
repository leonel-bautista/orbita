import { createTableData, deleteTableData, getTableData, updateTableData } from "../client.js";

const sidebar = document.querySelector('#sidebar');
const toggleBtn = document.querySelector('#toggle-sidebar-btn');
const listTitles = sidebar.querySelectorAll('.list-title');
const sidebarLinks = sidebar.querySelectorAll('a[data-table]');
const dropdownBtns = sidebar.querySelectorAll('.dropdown-btn');

const searchInput = document.querySelector('#search-input');
const reloadBtn = document.querySelector('#reload-btn');
const addBtn = document.querySelector('#add-btn');
const dialog = document.querySelector('dialog');
const form = dialog.querySelector('form');

let currentTable = { name: null, data: [] };
let selectorCache = { status: [ { id: 1, name: "Activo" }, { id: 0, name: "Inactivo" } ] };

const tables = {
    users: { title: 'Usuarios', options: [ 'id', 'image', 'tier', 'username', 'email', 'password' ] },
    roles: { title: 'Roles', options: [ 'id', 'name', 'description' ] },
    admins: { title: 'Administradores', options: [ 'id', 'user', 'role', 'area' ] },
    areas: { title: 'Áreas', options: [ 'id', 'name', 'description' ] },
    games: { title: 'Juegos', options: [ 'id', 'image', 'name', 'tags', 'platforms', 'launch', 'developer', 'description', 'status' ] },
    platforms: { title: 'Plataformas', options: [ 'id', 'name' ] },
    tags: { title: 'Etiquetas', options: [ 'id', 'name' ] },
    developers: { title: 'Desarrolladores', options: [ 'id', 'name' ] },
    tiers: { title: 'Planes', options: [ 'id', 'name', 'description' ] }
}

const fields = {
    id: { label: "ID", name: "id", type: null, editable: false },
    image: { label: "Imágen", name: "image", type: "file", optional: true },
    username: { label: "Nombre de usuario", name: "username", type: "text" },
    user: { label: "Usuario", name: "user", type: "select", loader: "users", editable: false },
    email: { label: "Correo electrónico", name: "email", type: "email" },
    password: { label: "Contraseña", name: "password", type: "password", column: false, editable: false },
    role: { label: "Rol", name: "role", type: "select", loader: "roles" },
    area: { label: "Área", name: "area", type: "select", loader: "areas" },
    tier: { label: "Plan", name: "tier", type: "select", loader: "tiers" },
    name: { label: "Nombre", name: "name", type: "text" },
    description: { label: "Descripción", name: "description", type: "textarea", column: false, optional: true },
    launch: { label: "Fecha de lanzamiento", name: "launch", type: "date" },
    platforms: { label: "Plataformas", name: "platforms", type: "select", multiple: true, loader: "platforms", optional: true },
    tags: { label: "Etiquetas", name: "tags", type: "select", multiple: true, loader: "tags", optional: true },
    developer: { label: "Desarrollador", name: "developer", type: "select", loader: "developers", optional: true },
    status: { label: "Estado", name: "status", type: "select" }
}

const ERR_MESSAGES = {
    IMAGE_OVERSIZE: "El tamaño de la imágen no debe sobrepasar 1MB.",
    IMAGE_TYPE: "El formato de la imágen debe ser PNG, JPG, JPEG o WEBP.",
    NAME_TAKEN: "El nombre de usuario ya está en uso.",
    NAME_MATCHING: "El nombre de usuario no puede ser el mismo que el anterior.",
    EMAIL_TAKEN: "Este correo ya está en uso.",
    PW_LENGTH_MIN: "La contraseña debe tener por lo menos 8 caracteres.",
    PW_LENGTH_MAX: "La contraseña no debe sobrepasar 72 caracteres.",

    REQUIRED: "Este campo es requerido.",
    WHITESPACES: "No se permiten espacios en blanco.",
}

const validators = {
    input: async (value, field) => {
        if (!['image', 'description'].includes(field) && !value.trim())
            return ERR_MESSAGES.REQUIRED;
        if (['email', 'password'].includes(field) && /\s/.test(value))
            return ERR_MESSAGES.WHITESPACES;

        switch (field) {
            case 'image': {
                if (value.type && !['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(value.type))
                    return ERR_MESSAGES.IMAGE_TYPE;
                if (value.size && value.size > 1 * 1024 * 1024)
                    return ERR_MESSAGES.IMAGE_OVERSIZE;
            } break;

            case 'username': {
                if (/\s/.test(value))
                    return ERR_MESSAGES.WHITESPACES;
                const userExists = await check('username', value);
                if (userExists)
                    return ERR_MESSAGES.NAME_TAKEN;
            } break;

            case 'email': {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                    return ERR_MESSAGES.INVALID_EMAIL;
                const emailExists = await check('email', value);
                if (emailExists)
                    return ERR_MESSAGES.EMAIL_TAKEN;
            } break;

            case 'password': {
                if (value.length < 8)
                    return ERR_MESSAGES.PW_LENGTH_MIN;
                if (value.length > 72)
                    return ERR_MESSAGES.PW_LENGTH_MAX;
            } break;
        }

        return "";
    },
    select: () => {
        return "";
    },
    textarea: () => {
        return "";
    }
}

function userExistenceChecker() {
    let lastValue = "";
    let lastChecked = false;
    let controller = null;

    return async function(method, value) {
        if (value === lastValue) return lastChecked;
        lastValue = value;

        controller?.abort();
        controller = new AbortController();

        try {
            const res = await findUserBy(method, value);
            res.ok ? lastChecked = res.body.exists
                   : lastChecked = false;
        } catch (error) {
            if (error.name !== 'AbortError') lastChecked = false;
        }

        return lastChecked;
    }
}
const check = userExistenceChecker();

const getInputValue = (input) => {
    if (!input) return;

    const { type } = input;
    const tag = input.tagName.toLowerCase();

    if (type === 'file') return input.files[0] || input.dataset.src || null;
    if (tag === 'select') return input.multiple ? Array.from(input.selectedOptions).map(option => option.value.trim()) : input.value.trim() || null;
    if (tag === 'input' || tag == 'textarea') return input.value.trim() || null;

    return null;
}

const formatDate = (date, display) => {
    if (!date) return '-';

    const newDate = new Date(date);
    let formattedDate;

    switch (display) {
        case 'table': {
            formattedDate = Intl.DateTimeFormat("es-AR", {
                dateStyle: "medium",
            }).format(newDate).toUpperCase();
        } break;

        case 'input': {
            formattedDate = newDate.toISOString().split("T")[0];
        } break;

        default: formattedDate = date;
    }

    return formattedDate;
}

const safeSplit = (str, splitter) => (str).split(splitter || ',').map(s => s.trim()).filter(Boolean);

// Sidebar
function toggleSidebar() {
    const isClosed = sidebar.classList.toggle('close');
    toggleBtn.classList.toggle('rotate');

    if (isClosed) {
        listTitles.forEach(title => title.classList.remove('show'));
        closeAllSubmenus();
    }
    else {
        listTitles.forEach(title => title.classList.add('show'));
    }
}

function toggleDropdown(btn) {
    const submenu = btn.nextElementSibling;
    if (!submenu) return;

    const isClosed = sidebar.classList.contains('close');
    if (isClosed) {
        sidebar.classList.remove('close');
        toggleBtn.classList.remove('rotate');
        listTitles.forEach(title => title.classList.add('show'));
    }

    submenu.classList.toggle('show');
    btn.classList.toggle('rotate');
}

function focusListItem(item) {
    sidebarLinks.forEach(link => link.classList.remove('active'));
    dropdownBtns.forEach(btn => btn.classList.remove('active'));

    item.classList.add('active');

    const parentItem = item.closest('.sub-menu')?.closest('li');
    const parentBtn = parentItem?.querySelector('.dropdown-btn');
    if (parentBtn) parentBtn.classList.add('active');
}

function closeAllSubmenus() {
    const activeSubmenus = sidebar.querySelectorAll('.show');
    activeSubmenus.forEach(submenu => {
        submenu.classList.remove('show');
        const btn = submenu.previousElementSibling;
        const isDropdownBtn = btn && btn.classList.contains('dropdown-btn');
        if (isDropdownBtn) btn.classList.remove('rotate');
    });
}

function setupSidebar() {
    toggleBtn.addEventListener('click', toggleSidebar);

    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', () => toggleDropdown(btn));
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const table = link.getAttribute('data-table');
            focusListItem(link);
            renderTableView(table);
        });
    });
}


// Table
function setupTableRow(data, columns) {
    const tbodyRow = document.createElement('tr');

    columns.forEach(col => {
        const td = document.createElement('td');
        let dataElement;

        switch (col) {
            case 'image': {
                dataElement = document.createElement('img');
                dataElement.src = data[col];
                dataElement.alt = data.name || 'Imágen';
            } break;
            case 'launch': {
                dataElement = document.createElement('span');
                dataElement.className = col;
                dataElement.textContent = formatDate(data[col], 'table');
            } break;
            case 'tags': {
                dataElement = document.createElement('div');
                dataElement.className = 'tags';
                const tagsList = safeSplit(data[col]);
                tagsList.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'tag';
                    span.textContent = tag;
                    dataElement.appendChild(span);
                })
            } break;
            case 'platforms': {
                dataElement = document.createElement('span');
                dataElement.className = col;
                const platformsList = safeSplit(data[col]).join(', ');
                dataElement.textContent = platformsList || '-';
            } break;
            case 'status': {
                dataElement = document.createElement('span');
                dataElement.classList.add('status');
                if (data[col] == 1 || data[col] === '1') {
                    dataElement.classList.add('active');
                    dataElement.textContent = 'Activo';
                }
                else {
                    dataElement.classList.add('inactive');
                    dataElement.textContent = 'Inactivo';
                }
            } break;
            default: {
                dataElement = document.createElement('span');
                dataElement.className = col;
                dataElement.textContent = data[col] ?? '-';
            }
        }

        td.appendChild(dataElement);
        tbodyRow.appendChild(td);
    });

    const tdActions = document.createElement('td');
    tdActions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    const editIcon = document.createElement('orbi-icon');
    editIcon.setAttribute('name', 'edit');
    editBtn.appendChild(editIcon);
    editBtn.addEventListener('click', () => openDialog(data));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    const deleteIcon = document.createElement('orbi-icon');
    deleteIcon.setAttribute('name', 'delete');
    deleteBtn.appendChild(deleteIcon);
    deleteBtn.addEventListener('click', () => handleDelete(data.id));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);
    tbodyRow.appendChild(tdActions);

    return tbodyRow;
}

function setupTable(tableName, tableData) {
    const { options } = tables[tableName];
    const table = document.querySelector('#data-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!tableData.length) {
        const tbodyRow = document.createElement('tr');
        const td = document.createElement('td');

        td.innerHTML = `No se encontraron resultados para <b>"${searchInput.value}"</b>`;

        tbodyRow.append(td);
        tbody.append(tbodyRow);

        return
    }

    const columns = options.filter(option => fields[option].column !== false);
    const theadRow = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = fields[col]?.label || col;
        th.dataset.column = col;
        theadRow.appendChild(th);
    });
    const thActions = document.createElement('th');
    thActions.textContent = "Acciones";
    theadRow.appendChild(thActions);

    thead.appendChild(theadRow);

    tableData.forEach(data => {
        const tbodyRow = setupTableRow(data, columns);
        tbody.append(tbodyRow);
    })
}

async function loadTableData(table) {
    try {
        const name = table.name || table;
        const res = await getTableData(name);
        const data = res.ok ? res.body : [];
        currentTable.name = name;
        currentTable.data = data;

        if (searchInput.value) searchInput.value = '';

        setupTable(name, data);
    }
    catch (error) {
        console.error("Hubo un error cargando los datos de la tabla:", error);
    }
}

async function searchTableData(query) {
    try {
        const res = await getTableData(currentTable.name, { name: query });
        const data = res.ok ? res.body : [];

        setupTable(currentTable.name, data);
    } catch (error) {
        setupTable(currentTable.name, []);
    }
}

function handleSearchInput() {
    const query = searchInput.value.trim();

    if (!query) setupTable(currentTable.name, currentTable.data);
    else searchTableData(query);
}

function renderTableView(tableName) {
    const dashboardView = document.querySelector('#dashboard-view');
    const tableView = document.querySelector('#table-view');
    const tableTitle = document.querySelector('.table-title');

    if (!tableName || tableName === 'dashboard') {
        dashboardView.classList.remove('hidden');
        tableView.classList.add('hidden');
        return
    }
    currentTable.name = tableName;

    if (searchInput.value) searchInput.value = '';

    dashboardView.classList.add('hidden');
    tableView.classList.remove('hidden');
    tableTitle.querySelector('span').textContent = tables[tableName]?.title || tableName;

    loadTableData(tableName);
}

function reloadTableData() {
    if (!currentTable) return;
    if (searchInput.value) searchInput.value = '';

    loadTableData(currentTable)
}

async function handleDelete(id) {
    if (confirm(`Está seguro de eliminar el registro (ID: ${id}) ?`)) {
        const res = await deleteTableData(currentTable.name, id);
        const { message, error } = res.body;

        if (!res.ok) {
            alert(error);
            return;
        }

        alert(message);
        reloadTableData();
    }
}


// Dialog
function handleImagePreview(input, preview) {
    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        preview.src = imageUrl;
        preview.hidden = false;
    })
}

async function setupSelectOptions(field, control, values) {
    const { name, loader } = field;

    if (name !== 'status') {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '--- Seleccionar ---';
        control.appendChild(emptyOption);
    }

    if (!selectorCache[name] && loader) {
        const res = await getTableData(loader);
        selectorCache[name] = res.ok ? res.body : [];
    }

    selectorCache[name].forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.id;
        optionElement.textContent = option.name || option.username;
        values?.includes(option.name || option.username) && (optionElement.selected = true);

        control.appendChild(optionElement);
    })
}

function setupDialogField(input, currentData = '') {
    const field = fields[input];
    const { label, name, editable, optional } = field;
    let type = field.type;

    const isEditable = editable !== false;
    const inputId = currentData.id && !isEditable ? '' : `${name}-field`;
    const value = currentData[input] ?? '';
    !inputId && (type = null);

    const container = document.createElement('div');
    container.classList.add('input-container');
    !inputId && (container.classList.add('read-only'));

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    optional && (labelElement.classList.add('optional'));
    inputId && (labelElement.htmlFor = inputId);
    container.appendChild(labelElement);

    let control;

    switch (type) {
        case 'file': {
            control = document.createElement('input');
            control.type = 'file';

            value && (control.dataset.src = safeSplit(value, '/').splice(2).toString());
            const preview = document.createElement('img');
            value && (preview.src = value);
            preview.hidden = !value;
            container.appendChild(preview);

            handleImagePreview(control, preview);
        } break;

        case 'select': {
            control = document.createElement('select');
            field.multiple && (control.multiple = true);

            const optionValues = String(value).split(',');
            setupSelectOptions(field, control, optionValues)
        } break;

        case 'date': {
            control = document.createElement('input');
            control.type = 'date';
            value && (control.value = formatDate(value, 'input'));
        } break;

        case 'textarea': {
            control = document.createElement('textarea');
            control.rows = 3;
            value && (control.value = value);
        } break;

        case null: {
            control = document.createElement('span');
            control.textContent = value;
        } break;

        default: {
            control = document.createElement('input');
            control.type = type || 'text';
            value && (control.value = value || '');
        }
    }

    inputId && (control.id = inputId);
    control.dataset.name = name;
    container.appendChild(control);

    return container;
}

function setupDialogActions() {
    const closeDialogBtn = dialog.querySelector('#close-dialog-btn');
    const cancelBtn = form.querySelector('#cancel-btn');
    
    closeDialogBtn.addEventListener('click', closeDialog);
    cancelBtn.addEventListener('click', closeDialog);
}

function setupDialog(tableName, currentData = '') {
    const { id } = currentData;
    const method = id ? 'update' : 'create';
    const { title, options } = tables[tableName];

    form.dataset.method = method;
    id && (form.dataset.id = id);

    const dialogTitle = dialog.querySelector('.dialog-title');
    dialogTitle.textContent = id ? `Editar ${title}` : `Crear ${title}`;

    const formBody = dialog.querySelector('.form-body');
    formBody.innerHTML = '';

    const inputs = options.filter(option => id ? fields[option] : fields[option].type !== null);

    inputs.forEach(input => {
        const formField = setupDialogField(input, currentData);
        formBody.appendChild(formField);
    })

    setupDialogActions(method);
}

function openDialog(rowData) {
    const { name } = currentTable;
    if (!name) return;

    setupDialog(name, rowData);
    dialog.showModal();
}

function closeDialog() {
    dialog.close();

    form.removeAttribute('data-method');
    form.removeAttribute('data-id');

    const formBody = form.querySelector('.form-body');
    formBody.innerHTML = '';
}

// Form
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

async function handleSubmit(event) {
    event.preventDefault();
    form.querySelectorAll('orbi-error')?.forEach(error => clearError(error.closest('.input-container') || form));

    const { method, id } = form.dataset;
    const { name: table } = currentTable;
    const formData = new FormData();

    const formInputs = form.querySelectorAll('.input-container > *[id]');
    await Promise.all(Array.from(formInputs).map(async (input) => {
        const tag = input.tagName.toLowerCase();
        const field = input.dataset.name;
        const value = getInputValue(input);
        const container = input.closest('.input-container');

        const errorMsg = await validators[tag](value, field);
        if (errorMsg) {
            showError(container, errorMsg);
            return;
        }

        value && (formData.append(field, value));
    }))

    const hasErrors = form.querySelectorAll('orbi-error').length > 0;
    if (hasErrors) return;

    let res;
    switch (method) {
        case 'create': res = await createTableData(table, formData); break;
        case 'update': res = await updateTableData(table, id, formData); break;
    }

    const { message, error } = res.body;

    if (!res.ok) {
        alert(error);
        return;
    }

    alert(message);
    closeDialog();
    reloadTableData();
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();

    searchInput?.addEventListener('input', handleSearchInput);
    reloadBtn?.addEventListener('click', reloadTableData);
    addBtn?.addEventListener('click', openDialog);

    form?.addEventListener('submit', handleSubmit);
});