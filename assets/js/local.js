import { checkWin, checkDraw } from './modules/logic.js';
import { updateCell, clearBoard, highlightWinningCells } from './modules/board.js';
import {
    gameBoard, gameActive,
    resetGameState, setGameActive,
    makeMove, endGame
} from './modules/game.js';

let currentPlayer = 'X';

// Éléments DOM
const board = document.getElementById('board');
const player = document.getElementById('player');
const gameOver = document.getElementById('gameOver');
const resetBtn = document.getElementById('resetBtn');

// Initialisation
function init() {
    board.addEventListener('click', handleCellClick);
    resetBtn.addEventListener('click', resetGame);
    updateCurrentPlayerDisplay();
}

// Gestion du clic sur une case
function handleCellClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const cellIndex = parseInt(cell.getAttribute('data-index'));
    if (gameBoard[cellIndex] !== '' || !gameActive) return;

    // Placer le symbole
    makeMove(board, cellIndex, currentPlayer, updateCell);

    // Vérifier la victoire
    const winningCombination = checkWin(gameBoard, currentPlayer);
    if (winningCombination) {
        highlightWinningCells(board, winningCombination);
        endGame(gameOver, `Joueur ${currentPlayer} gagne !`);
        return;
    }

    // Vérifier l'égalité
    if (checkDraw(gameBoard)) return endGame(gameOver, 'Égalité !', true);

    // Changer de joueur
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateCurrentPlayerDisplay();
}

// Mettre à jour l'affichage du joueur actuel
function updateCurrentPlayerDisplay() {
    player.textContent = `Joueur ${currentPlayer}`;
    player.className = `current-player ${currentPlayer === 'O' ? 'player-o' : ''}`;

    // Mettre à jour la classe sur le body pour les effets hover
    if (currentPlayer === 'O') {
        document.body.classList.add('player-o-turn');
    } else {
        document.body.classList.remove('player-o-turn');
    }
}

// Nouvelle partie
function resetGame() {
    currentPlayer = 'X';
    resetGameState();

    // Nettoyer le plateau
    clearBoard(board);

    // Cacher le message de fin
    gameOver.classList.remove('show', 'draw');

    // Mettre à jour l'affichage
    updateCurrentPlayerDisplay();
}

// Démarrer le jeu
document.addEventListener('DOMContentLoaded', init);