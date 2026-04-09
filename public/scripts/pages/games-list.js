import { getActiveGames, searchActiveGames } from "../client.js";

const searchInput = document.querySelector('#search-input');
const gamesList = document.querySelector('#games-list ul');

let cachedList = [];

async function handleSearch(event) {
    try {
        const name = event.target.value || '';
        if (!name.trim()) {
            renderGamesList(cachedList);
            return;
        }

        const res = await searchActiveGames(name);
        const games = res.ok ? res.body : [];
        renderGamesList(games);
    } catch (error) {
        if (gamesList) gamesList.innerHTML = '<li><h2>Hubo un problema al buscar. Vuelve a intentarlo más tarde.</h2></li>';
    }
}

function renderGamesList(games) {
    if (!gamesList) return;
    gamesList.innerHTML = '';

    if (games.length === 0) {
        gamesList.innerHTML = `<li><h2>No se encontraron juegos relacionados a "${searchInput?.value}".</h2></li>`;
        return;
    }

    games.forEach(game => {
        const item = document.createElement('li');
        item.className = 'listed-game';
        
        const link = document.createElement('a');
        link.href = `juegos/${encodeURIComponent(game.id)}`;

        const image = document.createElement('img');
        image.src = game.image || 'uploads/games/g-default.jpg';
        image.alt = game.name || 'Juego';
        
        const title = document.createElement('span');
        title.className = 'name';
        title.textContent = game.name || '-';

        link.appendChild(image);
        link.appendChild(title);
        item.appendChild(link);
        gamesList.appendChild(item);
    })
}

async function loadGamesList() {
    try {
        const res = await getActiveGames();
        const games = res.ok ? res.body : [];
        cachedList = games;

        renderGamesList(games);
    } catch (error) {
        if (gamesList) gamesList.innerHTML = '<li><h2>Hubo un problema al cargar la lista de juegos.</h2></li>';
    }
}

searchInput?.addEventListener('input', handleSearch);

document.addEventListener('DOMContentLoaded', loadGamesList);