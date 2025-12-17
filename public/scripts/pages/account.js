import { getProfile, getActiveGames } from '../client.js';

let currentUser = null;

let image, username, email, tier;
let editButtons, passwordBtn;
let links, views;
let dialog, dialogTitle, dialogBody, editForm, dialogCancel;

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showDialog() {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') {
    try { dialog.showModal(); }
    catch (e) { dialog.setAttribute('open', ''); }
  } else {
    dialog.setAttribute('open', '');
    dialog.classList.remove('hidden');
  }
  document.body.style.overflow = 'hidden';
}

function closeDialog() {
  if (!dialogBody) return;

  const selectedPreview = dialogBody.querySelector('#selected-image-preview');
  if (selectedPreview && selectedPreview.src && selectedPreview.src.startsWith('blob:')) {
    try { URL.revokeObjectURL(selectedPreview.src); } catch (err) { /* noop */ }
  }

  try {
    if (dialog && typeof dialog.close === 'function' && dialog.open) dialog.close();
    else if (dialog) dialog.removeAttribute('open');
  } catch (e) {
    if (dialog) dialog.classList.add('hidden');
    if (dialog) dialog.removeAttribute('open');
  }

  document.body.style.overflow = '';
  dialogBody.innerHTML = '';
}

function renderProfile(user) {
  if (!user) return;
  if (!image) return;
  document.title = `Órbita ⪼ ${user.username}`;

  image.onerror = () => { image.src = '/uploads/users/u-default.png'; };
  image.src = user.image || '/uploads/users/u-default.png';

  if (username) username.textContent = user.username || '';
  if (email) email.textContent = user.email || '';
  if (tier) tier.textContent = user.tier || '-';
}

function openEditDialog(field) {
  if (!currentUser) {
    console.warn('Perfil no cargado aún. Esperá un momento antes de editar.');
    return;
  }
  if (!dialogBody || !dialogTitle) return;

  dialogBody.innerHTML = '';
  dialogTitle.textContent = '';

  switch (field) {
    case 'username':
      dialogTitle.textContent = 'Editar nombre de usuario';
      dialogBody.innerHTML = `
        <label for="username-input">Nombre de usuario</label>
        <input id="username-input" name="username" type="text" value="${escapeHtml(currentUser.username || '')}" required>
      `;
      break;

    case 'image':
      dialogTitle.textContent = 'Cambiar foto de perfil';
      dialogBody.innerHTML = `
        <div class="image-compare">
          <div>
            <div class="label">Actual</div>
            <img id="current-image" src="${escapeHtml(currentUser.image || '/uploads/users/u-default.png')}" alt="Actual">
          </div>
          <div>
            <div class="label">Nueva</div>
            <img id="selected-image-preview" src="" alt="Nueva" style="display:none;">
          </div>
        </div>
        <label for="image-input">Seleccionar nueva imagen</label>
        <input id="image-input" name="image" type="file" accept="image/*">
      `;

      {
        const fileInput = dialogBody.querySelector('#image-input');
        const preview = dialogBody.querySelector('#selected-image-preview');
        if (fileInput && preview) {
          fileInput.addEventListener('change', () => {
            const f = fileInput.files[0];
            if (!f) {
              preview.style.display = 'none';
              preview.src = '';
              return;
            }
            if (!f.type || !f.type.startsWith('image/')) {
              alert('Seleccioná un archivo de imagen válido.');
              fileInput.value = '';
              return;
            }
            if (f.size > 5_000_000) {
              alert('La imagen debe pesar menos de 5 MB.');
              fileInput.value = '';
              return;
            }
            if (preview.src && preview.src.startsWith('blob:')) {
              try { URL.revokeObjectURL(preview.src); } catch (err) { /* noop */ }
            }
            const url = URL.createObjectURL(f);
            preview.src = url;
            preview.style.display = 'block';
          });
        }
      }
      break;

    case 'password':
      dialogTitle.textContent = 'Cambiar contraseña';
      dialogBody.innerHTML = `
        <label for="password-input">Nueva contraseña</label>
        <input id="password-input" name="password" type="password" placeholder="Nueva contraseña">
        <label for="password-confirm-input">Confirmar contraseña</label>
        <input id="password-confirm-input" name="passwordConfirm" type="password" placeholder="Confirmar contraseña">
      `;
      break;

    default:
      return;
  }

  showDialog();

  const firstInput = dialogBody.querySelector('input');
  if (firstInput) firstInput.focus();
}

async function handleDialogSubmit(e) {
  e.preventDefault();
  if (!dialogBody) return;
  if (!currentUser) {
    return alert('Perfil no cargado. Recargá la página e intentá de nuevo.');
  }

  const hasImageInput = !!dialogBody.querySelector('#image-input');
  const hasPasswordInput = !!dialogBody.querySelector('#password-input');
  const hasUsernameInput = !!dialogBody.querySelector('#username-input');

  if (hasPasswordInput) {
    const pw = dialogBody.querySelector('#password-input').value;
    const pwc = dialogBody.querySelector('#password-confirm-input').value;
    if (pw && pw.length < 8) return alert('La contraseña debe tener al menos 8 caracteres.');
    if (pw !== pwc) return alert('Las contraseñas no coinciden.');
  }
    if (hasUsernameInput) {
        const newName = dialogBody.querySelector('#username-input').value.trim();
        if (newName) {
            try {
            const resCheck = await fetch('http://api.app.test:4000/tables/users', { credentials: 'include' });
            const users = await resCheck.json().catch(() => []);
            const taken = Array.isArray(users) && users.some(u => u.username && String(u.username).trim().toLowerCase() === newName.toLowerCase() && String(u.id) !== String(currentUser?.id));
            if (taken) return alert('El nombre de usuario ya está en uso. Elegí otro.');
            } catch (err) {
            console.warn('No se pudo comprobar username, se continúa con el envío', err);
            }
        }
    }

  const formData = new FormData();
  if (hasUsernameInput) formData.append('username', dialogBody.querySelector('#username-input').value.trim());
  if (hasImageInput) {
    const file = dialogBody.querySelector('#image-input').files[0];
    if (file) {
      if (!file.type || !file.type.startsWith('image/')) return alert('Seleccioná un archivo de imagen válido.');
      if (file.size > 5_000_000) return alert('La imagen debe pesar menos de 5 MB.');
      formData.append('image', file);
    }
  }
  if (hasPasswordInput) {
    const pw = dialogBody.querySelector('#password-input').value;
    if (pw) formData.append('password', pw);
  }

  try {
    const res = await fetch(`http://api.app.test:4000/tables/users/update/${currentUser.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar');

    alert('Cambios guardados. La página se recargará para aplicar los cambios.');
    closeDialog();
    location.reload();
  } catch (err) {
    console.error(err);
    alert(err.message || 'No se pudo actualizar el perfil.');
  }
}

function setupEditButtons() {
  if (!editButtons) return;
  editButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      openEditDialog(field);
    });
  });

  if (passwordBtn) {
    passwordBtn.addEventListener('click', () => openEditDialog('password'));
  }
}

function loadProfileView() {
  if (currentUser) {
    renderProfile(currentUser);
    return;
  }
  getProfile().then(res => {
    if (res && res.ok) {
      currentUser = res.body;
      renderProfile(currentUser);
    } else {
      console.warn('No se pudo cargar perfil al mostrar la vista.');
    }
  }).catch(err => console.error('Error getProfile:', err));
}

async function loadLibrariesView() {
  const container = document.querySelector('#libraries-view');
  if (!container) return;
  container.innerHTML = '<p>Cargando juegos...</p>';

  try {
    const res = await getActiveGames();
    const games = res && res.ok ? res.body : [];

    if (!Array.isArray(games) || games.length === 0) {
      container.innerHTML = '<h2>Librerías</h2><p>No se encontraron juegos.</p>';
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'listed-games';

    games.forEach(g => {
      const li = document.createElement('li');
      li.className = 'listed-game';

      const a = document.createElement('a');
      a.href = `/juegos/${encodeURIComponent(g.id)}`;

      const img = document.createElement('img');
      img.src = g.image || '/uploads/g-default.jpg';
      img.alt = escapeHtml(g.name || 'Juego');

      const span = document.createElement('span');
      span.className = 'name';
      span.textContent = g.name || '-';

      a.appendChild(img);
      a.appendChild(span);
      li.appendChild(a);
      ul.appendChild(li);
    });

    container.innerHTML = '<h2>Librerías</h2>';
    container.appendChild(ul);
  } catch (err) {
    console.error('loadLibrariesView error:', err);
    container.innerHTML = `<h2>Librerías</h2><p>Error al cargar juegos: ${escapeHtml(err.message || String(err))}</p>`;
  }
}


const viewLoaders = {
  profile: () => loadProfileView && loadProfileView(),
  accounts: () => {},
  libraries: () => loadLibrariesView && loadLibrariesView()
};

function setupSidebarNavigation() {
  links = document.querySelectorAll('#account-sidebar a');
  views = document.querySelectorAll('.content-view');
  const defaultView = document.querySelector('#profile-view');

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      views.forEach(v => v.classList.add('hidden'));

      const viewName = link.dataset.view;
      if (!viewName) {
        console.warn('Link sin data-view:', link);
        if (defaultView) defaultView.classList.remove('hidden');
        if (viewLoaders.profile) viewLoaders.profile();
        return;
      }

      const target = document.querySelector(`#${viewName}-view`);
      if (!target) {
        console.warn(`No se encontró la vista con id "#${viewName}-view". Mostrando vista por defecto.`);
        if (defaultView) defaultView.classList.remove('hidden');
        if (viewLoaders.profile) viewLoaders.profile();
        return;
      }

      target.classList.remove('hidden');

      const loader = viewLoaders[viewName];
      if (typeof loader === 'function') {
        try { loader(); }
        catch (err) { console.error('Error en loader de vista', viewName, err); }
      }
    });
  });

  const activeLink = document.querySelector('#account-sidebar a.active');
  if (activeLink) activeLink.click();
  else if (defaultView) {
    defaultView.classList.remove('hidden');
    if (viewLoaders.profile) viewLoaders.profile();
  }
}

async function initProfile() {
  try {
    const res = await getProfile();
    if (!res.ok) throw new Error(res.error || 'No se pudo cargar el perfil');
    currentUser = res.body;
    renderProfile(currentUser);
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  image = document.querySelector('#image');
  username = document.querySelector('#username');
  email = document.querySelector('#email');
  tier = document.querySelector('#tier');

  editButtons = document.querySelectorAll('.edit-field-btn');
  passwordBtn = document.querySelector('#change-password-btn');

  dialog = document.querySelector('#edit-dialog');
  dialogTitle = document.querySelector('#dialog-title');
  dialogBody = document.querySelector('#dialog-body');
  editForm = document.querySelector('#edit-form');
  dialogCancel = document.querySelector('#dialog-cancel');

  if (dialogCancel) dialogCancel.addEventListener('click', closeDialog);
  if (editForm) editForm.addEventListener('submit', handleDialogSubmit);

  initProfile();
  setupSidebarNavigation();
  setupEditButtons();
});