import { getTableData } from '../client.js';

// Utilidad para formatear fecha
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(d).toUpperCase();
};

async function loadGame() {
  try {
    // Obtener id desde la URL (ej: /games/12)
    const parts = window.location.pathname.split('/');
    const gameId = parts[parts.length - 1];

    // 👉 Ajustá si tenés un endpoint específico, por ejemplo /tables/games/:id
    const res = await getTableData('games');
    const games = res.ok ? res.body : [];
    const game = games.find(g => String(g.id) === String(gameId));

    if (!game) {
      console.error("Juego no encontrado");
      return;
    }

    // Referencias a elementos
    const headerImg = document.querySelector('.game-header img');
    const nameEl = document.querySelector('.game-details .name');
    const tagsContainer = document.querySelector('.game-details .tags');
    const platformsContainer = document.querySelector('.game-details .platforms');
    const launchEl = document.querySelector('.development .launch');
    const developerEl = document.querySelector('.development .developer');
    const descTitle = document.querySelector('#game-info .title');
    const descEl = document.querySelector('#game-info .description');

    // Insertar datos
    headerImg.src = game.image || '/uploads/games/g-default.jpg';
    headerImg.alt = `Portada de ${game.name}`;
    nameEl.textContent = game.name;

    // Tags
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

    // Platforms
    // Mantener el título y limpiar solo los spans previos
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

    // Desarrollo
    launchEl.textContent = formatDate(game.launch);
    developerEl.textContent = game.developer || 'Desconocido';

    // Descripción
    descTitle.textContent = `Acerca de ${game.name.toUpperCase()}`;
    descEl.textContent = game.description || 'Sin descripción disponible.';
    document.title = `Órbita ⪼ ${game.name}`;
  } catch (err) {
    console.error("Error cargando juego:", err);
  }
}

document.addEventListener('DOMContentLoaded', loadGame);