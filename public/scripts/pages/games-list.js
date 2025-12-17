import { getActiveGames, searchActiveGames } from '../client.js';

const searchInput = document.querySelector('#search-input');
const listRoot = document.querySelector('#games-list ul');

let cachedGames = [];

// render simple de la lista
function renderGamesList(games) {
  if (!listRoot) return;
  listRoot.innerHTML = '';

  if (!Array.isArray(games) || games.length === 0) {
    listRoot.innerHTML = '<li>No hay juegos disponibles</li>';
    return;
  }

  games.forEach(game => {
    const li = document.createElement('li');
    li.className = 'listed-game';

    const a = document.createElement('a');
    a.href = `/juegos/${encodeURIComponent(game.id)}`;

    const img = document.createElement('img');
    img.src = game.image || '/uploads/games/g-default.jpg';
    img.alt = game.name || 'Juego';

    const span = document.createElement('span');
    span.className = 'name';
    span.textContent = game.name || '-';

    a.appendChild(img);
    a.appendChild(span);
    li.appendChild(a);
    listRoot.appendChild(li);
  });
}

async function loadGamesList() {
    try {
        const res = await getActiveGames();
        const games = res.ok ? res.body : [];

        const list = document.querySelector('#games-list ul');
        list.innerHTML = '';

        if (!games.length) {
        list.innerHTML = '<li>No hay juegos disponibles</li>';
        return;
        }

        games.forEach(game => {
        const li = document.createElement('li');
        li.className = 'listed-game';

        const a = document.createElement('a');
        a.href = `/juegos/${game.id}`;

        const img = document.createElement('img');
        img.src = game.image || '/uploads/games/g-default.jpg';
        img.alt = game.name || 'Juego';

        const span = document.createElement('span');
        span.className = 'name';
        span.textContent = game.name;

        a.appendChild(img);
        a.appendChild(span);
        li.appendChild(a);
        list.appendChild(li);
        });
    } catch (error) {
        console.error('Error cargando juegos:', error);
        const list = document.querySelector('#games-list ul');
        list.innerHTML = '<li>Error al cargar juegos</li>';
    }
}

async function searchTableData(query) {
  try {
    // si query vacío, mostramos cache
    if (!query || !String(query).trim()) {
      renderGamesList(cachedGames);
      return;
    }
    const res = await searchActiveGames(query);
    const games = res && res.ok ? res.body : [];
    renderGamesList(Array.isArray(games) ? games : []);
  } catch (error) {
    console.error('Error buscando juegos:', error);
    if (listRoot) listRoot.innerHTML = '<li>Error en búsqueda</li>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
    searchInput?.addEventListener('input', (e) => {
        const q = e.target.value || '';
        if (!q) {
            loadGamesList(); // recarga la lista inicial
            return;
        }
        searchTableData(q);
    });
    loadGamesList();
});