import '../components/orbi-logo.js'
import '../components/orbi-icon.js'
import '../components/orbi-error.js'
import { getTableData } from '../client.js'

const sidebar = document.querySelector('#sidebar');
const listTitles = document.querySelectorAll('.list-title');
const toggleBtn = document.querySelector('#toggle-btn');
const tableLinks = document.querySelectorAll('a[data-table]');
const dropdownBtns = document.querySelectorAll('.dropdown-btn');

const dashboardView = document.querySelector('#dashboard-view');
const tableView = document.querySelector('#table-view');
const tableTitle = document.querySelector('#table-title');
const searchInput = document.querySelector('#search-input');
const reloadBtn = document.querySelector('#reload-btn');
const addBtn = document.querySelector('#add-btn');

const tableHead = document.querySelector('#data-table thead');
const tableBody = document.querySelector('#data-table tbody');

const dialog = document.querySelector('dialog');

let currentTable = null;
let currentTableData = [];
let cache = {};

const ignoredFields = new Set([
  'user_id','role_id','admin_id','game_id',
  'platform_id','tag_id','developer_id','area_id','tier_id'
]);
const excludedColumns = new Set(['password','pin']);

/* ---------------------------
   Nombres legibles de tablas
   --------------------------- */
const tableNames = {
  users: 'Usuarios',
  roles: 'Roles',
  admins: 'Administradores',
  areas: 'Áreas',
  games: 'Juegos',
  platforms: 'Plataformas',
  tags: 'Etiquetas',
  developers: 'Desarrolladores',
  tiers: 'Planes'
};
const fieldLabels = {
  id: 'ID',
  image: 'Imágen',
  username: 'Usuario',
  email: 'Correo electrónico',
  password: 'Contraseña',
  role: 'Rol',
  area: 'Área',
  tier: 'Plan',
  name: 'Nombre',
  description: 'Descripción',
  launch: 'Fecha de lanzamiento',
  platforms: 'Plataformas',
  tags: 'Etiquetas',
  developer: 'Desarrollador',
  status: 'Estado'
};

const selectLoaders = {
  tier: async (selectEl) => {
    if (!cache.tiers) {
      const res = await fetch("http://api.app.test:4000/tables/tiers", { credentials: 'include' });
      cache.tiers = await res.json().catch(() => []);
    }
    cache.tiers.forEach(tier => {
      const option = document.createElement('option');
      option.value = tier.id;
      option.textContent = tier.name;
      selectEl.appendChild(option);
    });
  },
  platforms: async (selectEl) => {
    if (!cache.platforms) {
      const res = await fetch("http://api.app.test:4000/tables/platforms", { credentials: 'include' });
      cache.platforms = await res.json().catch(() => []);
    }
    cache.platforms.forEach(platform => {
      const option = document.createElement('option');
      option.value = platform.id;
      option.textContent = platform.name;
      selectEl.appendChild(option);
    });
    selectEl.multiple = true;
  },
  tags: async (selectEl) => {
    if (!cache.tags) {
      const res = await fetch("http://api.app.test:4000/tables/tags", { credentials: 'include' });
      cache.tags = await res.json().catch(() => []);
    }
    cache.tags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag.id;
      option.textContent = tag.name;
      selectEl.appendChild(option);
    });
    selectEl.multiple = true;
  },
  role: async (selectEl) => {
    if (!cache.roles) {
      const res = await fetch("http://api.app.test:4000/tables/roles", { credentials: 'include' });
      cache.roles = await res.json().catch(() => []);
    }
    cache.roles.forEach(role => {
      const option = document.createElement('option');
      option.value = role.id;
      option.textContent = role.name;
      selectEl.appendChild(option);
    });
  },
  areas: async (selectEl) => {
    if (!cache.areas) {
      const res = await fetch("http://api.app.test:4000/tables/areas", { credentials: 'include' });
      cache.areas = await res.json().catch(() => []);
    }
    cache.areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area.id;
      option.textContent = area.name;
      selectEl.appendChild(option);
    });
  },
  developer: async (selectEl) => {
    if (!cache.developers) {
      const res = await fetch("http://api.app.test:4000/tables/developers", { credentials: 'include' });
      cache.developers = await res.json().catch(() => []);
    }
    cache.developers.forEach(dev => {
      const option = document.createElement('option');
      option.value = dev.id;
      option.textContent = dev.name;
      selectEl.appendChild(option);
    });
  },
users: async (selectEl) => {
    if (!cache.users) {
        const res = await fetch("http://api.app.test:4000/tables/users", { credentials: 'include' });
        cache.users = await res.json().catch(() => []);
    }
    cache.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.username;
        selectEl.appendChild(option);
    });
    }


};

/* ---------------------------
   Mensajes y validaciones
   --------------------------- */
const ERR_MESSAGES = {
  REQUIRED: "Este campo es requerido.",
  WHITESPACES: "No se permiten espacios en blanco.",
  INVALID_EMAIL: "Correo electrónico inválido.",
  EXISTING_EMAIL: "Este correo ya está en uso.",
  PW_LENGTH_MIN: "La contraseña debe tener por lo menos 8 caracteres.",
  PW_LENGTH_MAX: "La contraseña no debe sobrepasar 72 caracteres.",
};

function validateFields(name, type, value) {
  if (name === 'description' || name === 'image' || name === 'username') return "";
  const scalar = Array.isArray(value) ? value.join(',') : value;

  if (!scalar || !String(scalar).trim()) return ERR_MESSAGES.REQUIRED;
  if (/\s/.test(String(scalar))
    && !['textarea','select'].includes(type)
    && !['username','name'].includes(name)) {
    return ERR_MESSAGES.WHITESPACES;
  }

  if (/email/i.test(name)) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(scalar))) return ERR_MESSAGES.INVALID_EMAIL;
  }
  if (name === 'password') {
    const len = String(scalar).length;
    if (len < 8) return ERR_MESSAGES.PW_LENGTH_MIN;
    if (len > 72) return ERR_MESSAGES.PW_LENGTH_MAX;
  }
  return "";
}

function getControlValue(control, type) {
  if (!control) return null;
  const tag = control.tagName.toLowerCase();
  if (type === 'file' || control.type === 'file') return control.files[0] ?? null;
  if (tag === 'select') return control.multiple ? Array.from(control.selectedOptions).map(opt => opt.value) : control.value;
  if (tag === 'textarea' || tag === 'input') return control.value ?? '';
  return control.textContent ?? null;
}


/* ---------------------------
   Utilidades de formato
   --------------------------- */
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-AR",{dateStyle:"medium"}).format(d).toUpperCase();
};
function safeSplitComma(str){return (str||'').split(',').map(s=>s.trim()).filter(Boolean);}

/* ---------------------------
   Presets (users/games fijos, resto dinámico)
   --------------------------- */
const PRESETS = {
  users: {
    columns: ['id','image','tier','username','email'],
    form: [
      { name:'image', type:'file' },
      { name:'tier', type:'select', loader:'tier' },
      { name:'username', type:'text' },
      { name:'email', type:'email' },
      { name:'password', type:'password' }
    ]
  },
  games: {
    columns: ['id','image','name','tags','platforms','launch','developer','status'],
    form: [
      { name:'image', type:'file' },
      { name:'name', type:'text' },
      { name:'tags', type:'select', loader:'tags' },
      { name:'platforms', type:'select', loader:'platforms' },
      { name:'launch', type:'date' },
      { name:'developer', type:'select', loader:'developer' },
      { name:'description', type:'textarea' },
      { name:'status', type:'select', options:[
        { value:'1', text:'Activo' },
        { value:'0', text:'Inactivo' }
      ]}
    ]
  },
  generic: {
    default:['id','name'],
    special:{
      tiers:['id','name','description'],
      areas:['id','name','description'],
      admins: ['id','user','role','area']
    }
  }
};

/* ---------------------------
   Tipos de campo inferidos
   --------------------------- */
function getFieldType(name){
  if(/email/i.test(name))return 'email';
  if(/password|pin/i.test(name))return 'password';
  if(/image|file/i.test(name))return 'file';
  if(/launch/i.test(name))return 'date';
  if(/description/i.test(name))return 'textarea';
  if(currentTable==='users'&&name==='tier')return 'select';
  if(currentTable==='games'&&(name==='platforms'||name==='tags'||name==='developer'||name==='status'))return 'select';
  if(currentTable==='admins'&&(name==='user'||name==='role'||name==='area'))return 'select';
  return 'text';
}

async function openEditDialog(row) {
  const schema = getSchema({ forEdit: true });
  dialog.querySelector('#dialog-title').textContent = `Editar ${tableNames[currentTable] || currentTable}`;
  await renderDialogForm(schema);

  const form = dialog.querySelector('form');
  form.dataset.mode = 'edit';
  form.dataset.id = row.id ?? '';

  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.classList.remove('create');
  submitBtn.classList.add('edit');

  // ID readonly visual
  if (row.id !== undefined) {
    const idGroup = document.createElement('div');
    idGroup.className = 'form-group read-only';
    idGroup.innerHTML = `<label>ID</label><span>${row.id}</span>`;
    form.insertBefore(idGroup, form.firstChild);
  }

  // Usuario readonly en admins
  if (currentTable === 'admins') {
    const username = row.username || row.user || row.name || '-';
    const userGroup = document.createElement('div');
    userGroup.className = 'form-group read-only';
    userGroup.innerHTML = `<label>Usuario</label><span>${username}</span>`;
    form.insertBefore(userGroup, form.firstChild.nextSibling);
  }

  // Prefijar valores en los campos editables
  for (const { name, type } of schema) {
    const control = dialog.querySelector(`#${name}-field`);
    if (!control) continue;

    if (control.type === 'file') {
      const preview = control.nextElementSibling?.tagName === 'IMG' ? control.nextElementSibling : null;
      const imageUrl = row[name] || row.image || null;
      if (preview && imageUrl) {
        preview.src = imageUrl;
        preview.style.display = 'block';
      }
      continue;
    }

    if (control.tagName.toLowerCase() === 'select' && control.multiple) {
      let values = row[name];
      if (typeof values === 'string') values = values.split(',').map(s => s.trim()).filter(Boolean);
      if (!Array.isArray(values)) values = values == null ? [] : [String(values)];
      Array.from(control.options).forEach(opt => {
        opt.selected = values.includes(opt.value) || values.includes(opt.textContent.trim());
      });
      continue;
    }

    if (control.tagName.toLowerCase() === 'select') {
      const val = row[name];
      if (val != null) {
        const byVal = Array.from(control.options).find(o => o.value == val);
        const byText = Array.from(control.options).find(o => o.textContent.trim() == String(val).trim());
        control.value = byVal ? byVal.value : byText ? byText.value : val;
      } else {
        control.value = '';
      }
      continue;
    }

    if (control.type === 'date') {
      const raw = row[name];
      if (raw) {
        const d = new Date(raw);
        if (!isNaN(d)) {
          control.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
      }
      continue;
    }

    control.value = row[name] ?? '';
  }

  dialog.showModal();
}



/* ---------------------------
   Render de tabla
   --------------------------- */
function renderTable(data) {
  tableHead.innerHTML = '';
  tableBody.innerHTML = '';

  if (!data || !data.length) {
    tableBody.innerHTML = '<tr><td colspan="100%">Sin datos</td></tr>';
    return;
  }

  let columns;
  if (currentTable === 'users') {
    columns = PRESETS.users.columns;
  } else if (currentTable === 'games') {
    columns = PRESETS.games.columns;
  } else {
    const rawCols = Object.keys(data[0]);
    columns = rawCols
      .filter(c => !ignoredFields.has(c))
      .filter(c => !excludedColumns.has(c));
    const preferred = ['id','name','description'];
    const ordered = [];
    preferred.forEach(p=>{
      const idx = columns.indexOf(p);
      if (idx !== -1) { ordered.push(p); columns.splice(idx,1); }
    });
    columns = ordered.concat(columns);
  }

  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = fieldLabels[col] || col;
    th.dataset.field = col;
    headerRow.appendChild(th);
  });
  const thActions = document.createElement('th');
  thActions.textContent = 'Acciones';
  headerRow.appendChild(thActions);
  tableHead.appendChild(headerRow);

  data.forEach(row => {
    const bodyRow = document.createElement('tr');

    columns.forEach(col => {
      const td = document.createElement('td');
      switch (col) {
        case 'image': {
          const img = document.createElement('img');
          img.src = row[col] || '/uploads/g-default.jpg';
          img.alt = row.name || row.username || 'imagen';
          td.appendChild(img);
        } break;
        case 'launch': {
          const span = document.createElement('span');
          span.className = col;
          span.textContent = formatDate(row[col]);
          td.appendChild(span);
        } break;
        case 'tags': {
          const div = document.createElement('div');
          div.className = 'tags';
          const tagsArray = safeSplitComma(row[col]);
          tagsArray.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            div.appendChild(span);
          });
          td.appendChild(div);
        } break;
        case 'platforms': {
          const span = document.createElement('span');
          span.className = col;
          const platforms = safeSplitComma(row[col]).join(', ');
          span.textContent = platforms || '-';
          td.appendChild(span);
        } break;
        case 'status': {
          const span = document.createElement('span');
          span.classList.add('status');
          if (row[col] == 1 || row[col] === '1' || row[col] === true) {
            span.classList.add('active');
            span.textContent = 'Activo';
          } else {
            span.classList.add('inactive');
            span.textContent = 'Inactivo';
          }
          td.appendChild(span);
        } break;
        default: {
          const span = document.createElement('span');
          span.className = col;
          span.textContent = row[col] ?? '-';
          td.appendChild(span);
        }
      }
      bodyRow.appendChild(td);
    });

    const tdActions = document.createElement('td');
    tdActions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    const editIcon = document.createElement('orbi-icon');
    editIcon.setAttribute('name', 'edit');
    editBtn.appendChild(editIcon);
    editBtn.addEventListener('click', () => openEditDialog(row));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    const deleteIcon = document.createElement('orbi-icon');
    deleteIcon.setAttribute('name', 'delete');
    deleteBtn.appendChild(deleteIcon);
    deleteBtn.addEventListener('click', () => deleteRecord(row.id));

    tdActions.appendChild(editBtn);
    tdActions.appendChild(deleteBtn);

    bodyRow.appendChild(tdActions);
    tableBody.appendChild(bodyRow);
  });
}

/* ---------------------------
   Schema: fijo para users/games; dinámico resto
   --------------------------- */
function getSchema({ forEdit = false } = {}) {
  if (currentTable === 'users') {
    return PRESETS.users.form.map(f => ({ name: f.name, type: f.type, options: f.options, loader: f.loader }));
  }
  if (currentTable === 'games') {
    return PRESETS.games.form.map(f => ({ name: f.name, type: f.type, options: f.options, loader: f.loader }));
  }
  if (currentTable === 'admins') {
    if (forEdit) {
      // edición: solo rol y área
      return [
        { name: 'role', type: 'select', loader: 'role' },
        { name: 'area', type: 'select', loader: 'areas' }
      ];
    } else {
      // creación: incluir user
      return [
        { name: 'user', type: 'select', loader: 'users' },
        { name: 'role', type: 'select', loader: 'role' },
        { name: 'area', type: 'select', loader: 'areas' }
      ];
    }
  }

  // genérico
  const thData = tableHead.querySelectorAll('th[data-field]');
  let schema = Array.from(thData)
    .map(th => {
      const name = th.dataset.field;
      if (name === 'id') return null;
      if (excludedColumns.has(name)) return null;
      return { name, type: getFieldType(name) };
    })
    .filter(Boolean)
    .filter(s => !ignoredFields.has(s.name));

  return schema;
}



/* ---------------------------
   Render de formulario de diálogo
   --------------------------- */
async function renderDialogForm(schema) {
  const form = dialog.querySelector('form');
  form.innerHTML = '';

  for (const field of schema) {
    const name = field.name;
    const type = field.type;
    const id = `${name}-field`;
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = fieldLabels[name] || name;
    group.appendChild(labelEl);

    let control;
    switch (type) {
      case 'textarea':
        control = document.createElement('textarea');
        control.rows = 3;
        break;

      case 'select':
        control = document.createElement('select');

        if (name !== 'status') {
          const emptyOption = document.createElement('option');
          emptyOption.value = '';
          emptyOption.textContent = '--- Seleccionar ---';
          control.appendChild(emptyOption);
        }

        if (field.options && Array.isArray(field.options)) {
          field.options.forEach(optDef => {
            const opt = document.createElement('option');
            opt.value = optDef.value;
            opt.textContent = optDef.text;
            control.appendChild(opt);
          });
        } else {
          const loaderName = field.loader || name || name.toLowerCase();
          const loader = selectLoaders[loaderName] || selectLoaders[name.toLowerCase()];
          if (loader && !control.dataset.loaded) {
            control.innerHTML = '';
            if (name !== 'status') {
              const emptyOption = document.createElement('option');
              emptyOption.value = '';
              emptyOption.textContent = '--- Seleccionar ---';
              control.appendChild(emptyOption);
            }
            await loader(control);
            control.dataset.loaded = 'true';
          }
        }

        if (name === 'tags' || name === 'platforms' || field.multiple) control.multiple = true;
        break;

      case 'file':
        control = document.createElement('input');
        control.type = 'file';
        control.accept = 'image/*';

        const preview = document.createElement('img');
        preview.style.display = 'none';
        // preview.style.maxHeight = '80px';

        control.addEventListener('change', () => {
          const file = control.files[0];
          if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
          } else {
            preview.style.display = 'none';
          }
        });

        group.appendChild(control);
        group.appendChild(preview);
        control.id = id;
        control.name = fieldLabels[name] || name;
        control.addEventListener('input', handleFieldError);
        form.appendChild(group);
        continue;

      default:
        control = document.createElement('input');
        control.type = type || 'text';
    }

    control.name = fieldLabels[name] || name;
    control.id = id;
    control.addEventListener('input', handleFieldError);
    group.appendChild(control);
    form.appendChild(group);
  }

  const actions = document.createElement('div');
  actions.className = 'dialog-actions';
  actions.innerHTML = `
    <button type="button" class="cancel-btn">Cancelar</button>
    <button type="submit" class="submit-btn">Enviar</button>
  `;
  form.appendChild(actions);

  form.removeEventListener('submit', handleSubmit);
  form.addEventListener('submit', handleSubmit);

  const cancelBtn = form.querySelector('.cancel-btn');
  if (cancelBtn) {
    cancelBtn.removeEventListener('click', closeDialog);
    cancelBtn.addEventListener('click', closeDialog);
  }
}

/* ---------------------------
   Abrir dialog (crear)
   --------------------------- */
async function openDialog() {
  const schema = getSchema({ forEdit: false });
  dialog.querySelector('#dialog-title').textContent = `Crear ${tableNames[currentTable] || currentTable}`;
  await renderDialogForm(schema);

  const form = dialog.querySelector('form');
  form.dataset.mode = 'create';
  form.dataset.id = '';

  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.classList.remove('edit');
  submitBtn.classList.add('create');

  const statusControl = dialog.querySelector('#status-field');
  if (statusControl) statusControl.value = '1';

  dialog.showModal();
}

/* ---------------------------
   Cerrar dialog
   --------------------------- */
function closeDialog() {
  dialog.close();
  const form = dialog.querySelector('form');
  if (form) form.innerHTML = '';
}

/* ---------------------------
   Submit crear/editar
   --------------------------- */
function buildFormData(schema, values) {
const formData = new FormData();

for (const field of schema) {
const name = field.name;
const value = values[name];

if (value == null) continue;

// Si es archivo
if (field.type === 'file' && value instanceof File) {
  formData.append(name, value);
  continue;
}

// Si es select múltiple → array
if (Array.isArray(value)) {
  value.forEach(v => formData.append(name, v));
  continue;
}

// Valor escalar
formData.append(name, value);
}

return formData;
}

async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const isEdit = form.dataset.mode === 'edit';
  const recordId = form.dataset.id;
  let schema = getSchema({ forEdit: isEdit });

  // Protección opcional: nunca enviar user en edición de admins
  if (currentTable === 'admins' && isEdit) {
    schema = schema.filter(f => f.name !== 'user');
  }

  dialog.querySelectorAll('.form-group').forEach(group => clearError(group));
  clearError(form);

  let hasError = false;
  const values = {};

  for (const field of schema) {
    const control = dialog.querySelector(`#${field.name}-field`);
    const value = getControlValue(control, field.type);
    const err = validateFields(field.name, field.type, value);
    if (err) {
      const container = control?.closest('.form-group') || form;
      showError(container, err);
      hasError = true;
    }
    values[field.name] = value;
  }
  if (hasError) return;

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    let body, headers = {};
    if (currentTable === 'users' || currentTable === 'games') {
      // 👉 ahora sí existe buildFormData
      body = buildFormData(schema, values);
    } else {
      body = JSON.stringify(values);
      headers['Content-Type'] = 'application/json';
    }

    const url = isEdit
      ? `http://api.app.test:4000/tables/${currentTable}/update/${recordId}`
      : `http://api.app.test:4000/tables/${currentTable}/create`;

    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers,
      body
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      closeDialog();
      loadTableData(currentTable);
    } else {
      Object.entries(data).forEach(([key, msg]) => {
        if (key === 'error' || key === 'message') return;
        const control = dialog.querySelector(`#${key}-field`);
        const container = control ? control.closest('.form-group') : form;
        showError(container, msg);
      });
      if (data.error || data.message) showError(form, data.error || data.message);
    }
  } catch (error) {
    showError(form, error.message);
  } finally {
    btn.disabled = false;
  }
}

/* ---------------------------
   Eliminar registro
   --------------------------- */
async function deleteRecord(id) {
  if (!confirm('¿Seguro que querés eliminar este registro?')) return;
  try {
    const res = await fetch(`http://api.app.test:4000/tables/${currentTable}/delete/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (res.ok) {
      loadTableData(currentTable);
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Error al eliminar');
    }
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

/* ---------------------------
   Cargar datos de tabla
   --------------------------- */
async function loadTableData(tableName) {
  try {
    const res = await getTableData(tableName);
    currentTableData = res.ok ? res.body : [];

    if (searchInput) searchInput.value = '';
    renderTable(currentTableData);
  } catch (error) {
    console.error('Error cargando tabla:', error);
    tableBody.innerHTML = `<tr><td colspan="100%">Error al cargar datos: ${error.message}</td></tr>`;
  }
}

async function searchTableData(query) {
  try {
    const res = await getTableData(currentTable, { name: query });
    currentTableData = res.ok ? res.body : [];
    renderTable(currentTableData);
  } catch (error) {
    console.error('Error buscando en tabla:', error);
    tableBody.innerHTML = `<tr><td colspan="100%">Error en búsqueda: ${error.message}</td></tr>`;
  }
}

/* ---------------------------
   Vista de tabla y sidebar
   --------------------------- */
function renderTableView(tableName) {
  if (!tableName || tableName === 'dashboard') {
    dashboardView.classList.remove('hidden');
    tableView.classList.add('hidden');
    return;
  }
  currentTable = tableName;

  if (searchInput) searchInput.value = '';
  dashboardView.classList.add('hidden');
  tableView.classList.remove('hidden');
  tableTitle.querySelector('span').textContent = tableNames[tableName] || tableName;

  loadTableData(tableName);
}

function closeAllSubmenus() {
  sidebar.querySelectorAll('.show').forEach(submenu => {
    submenu.classList.remove('show');
    const btn = submenu.previousElementSibling;
    if (btn?.classList.contains('dropdown-btn')) btn.classList.remove('rotate');
  });
}

function toggleSidebar() {
  const closing = sidebar.classList.toggle('close');
  toggleBtn.classList.toggle('rotate');
  if (closing) {
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

  if (sidebar.classList.contains('close')) {
    sidebar.classList.remove('close');
    toggleBtn.classList.remove('rotate');
    listTitles.forEach(title => title.classList.add('show'));
  }

  submenu.classList.toggle('show');
  btn.classList.toggle('rotate');
}

function markActiveLink(link) {
  tableLinks.forEach(a => a.classList.remove('active'));
  dropdownBtns.forEach(btn => btn.classList.remove('active'));

  link.classList.add('active');

  const parentLink = link.closest('.sub-menu')?.closest('li');
  const parentBtn = parentLink?.querySelector('.dropdown-btn');

  if (parentBtn) parentBtn.classList.add('active');
}

/* ---------------------------
   Errores UI
   --------------------------- */
function showError(container, message) {
  if (!container) return;

  let errorEl = container.querySelector('orbi-error');
  if (!errorEl) {
    errorEl = document.createElement('orbi-error');
    container.appendChild(errorEl);
  }
  container.classList.add('error');
  errorEl.setAttribute('message', message);

  if (container === dialog.querySelector('form')) errorEl.setAttribute('no-bg', '');
}

function clearError(container) {
  if (!container) return;
  container.classList.remove('error');
  const errorEl = container.querySelector('orbi-error');
  if (errorEl) errorEl.remove();
}

function handleFieldError(e) {
  const { type, target } = e;
  const container = target.closest('.form-group');
  const name = target.name || target.id.replace('-field','');
  const value = getControlValue(target, target.type || target.tagName.toLowerCase());
  const errorMsg = validateFields(name, target.type || target.tagName.toLowerCase(), value);

  if (type === 'input' && !errorMsg) clearError(container);
  else if (type === 'blur' && errorMsg) showError(container, errorMsg);
  else if (!errorMsg) clearError(container);
}

/* ---------------------------
   Eventos DOM
   --------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  toggleBtn?.addEventListener('click', toggleSidebar);

  dropdownBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDropdown(btn);
    });
  });

  tableLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tableName = link.getAttribute('data-table');
      renderTableView(tableName);
      markActiveLink(link);
    });
  });

  reloadBtn?.addEventListener('click', () => {
    if (!currentTable) return;
    if (searchInput) searchInput.value = '';

    loadTableData(currentTable);
  });

  addBtn?.addEventListener('click', () => currentTable && openDialog());

  dialog?.querySelector('#close-dialog-btn')?.addEventListener('click', closeDialog);

  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query) searchTableData(query);
    else loadTableData(currentTable)
  })
});