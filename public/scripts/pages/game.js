import { getTableData } from '../client.js';

const mainInfoSection = document.querySelector('section#game-info');
const extraInfoSection = document.querySelector('section#extra-info');

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(d).toUpperCase();
};

async function loadGame() {
  try {
    const parts = window.location.pathname.split('/');
    const gameId = parts[parts.length - 1];

    const res = await getTableData('games');
    const games = res.ok ? res.body : [];
    const game = games.find(g => String(g.id) === String(gameId));

    if (!game) {
      console.error("No se encontraron datos del juego.");
      return;
    }

    const img = mainInfoSection.querySelector('img');
    const name = mainInfoSection.querySelector('.basic-details .name');
    const tagsContainer = mainInfoSection.querySelector('.basic-details .tags');
    const platformsContainer = mainInfoSection.querySelector('.basic-details .platforms');
    const launch = mainInfoSection.querySelector('.development-details .launch');
    const developer = mainInfoSection.querySelector('.development-details .developer');

    const descTitle = extraInfoSection.querySelector('.title');
    const descBody = extraInfoSection.querySelector('.description');

    img.src = game.image || 'uploads/games/g-default.jpg';
    img.alt = `Portada de ${game.name}`;
    name.textContent = game.name;

    tagsContainer.innerHTML = '';
    if (game.tags) {
      game.tags.split(',').forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag.trim();
        tagsContainer.appendChild(span);
      });
    } else {
      tagsContainer.innerHTML = '<span class="tag">Sin etiquetas</span>';
    }

    const subtitle = platformsContainer.querySelector('.subtitle');
    platformsContainer.innerHTML = '';
    platformsContainer.appendChild(subtitle);

    if (game.platforms) {
        game.platforms.split(',').forEach(p => {
        const span = document.createElement('span');
        span.className = 'platform';
        span.textContent = p.trim();
        platformsContainer.appendChild(span);
    });
    } else {
        const span = document.createElement('span');
        span.className = 'platform';
        span.textContent = 'No disponible';
        platformsContainer.appendChild(span);
    }

    launch.textContent = formatDate(game.launch);
    developer.textContent = game.developer || 'Desconocido';

    descTitle.textContent = `Acerca de ${game.name.toUpperCase()}`;
    descBody.textContent = game.description || 'Sin descripción disponible.';
    document.title = `Órbita ⪼ ${game.name}`;
  } catch (error) {
    console.error("Error cargando juego:", error);
  }
}

document.addEventListener('DOMContentLoaded', loadGame);