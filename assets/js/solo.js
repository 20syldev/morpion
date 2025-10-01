import { checkWin, checkDraw } from './modules/logic.js';
import { updateCell, clearBoard, highlightWinningCells, updateStatus } from './modules/board.js';
import { getAIMove } from './modules/ai.js';
import {
    gameBoard, gameActive,
    resetGameState, setGameActive,
    makeMove, endGame
} from './modules/game.js';

let difficulty = null;
let playerSymbol = 'X';
let aiSymbol = 'O';

// Éléments DOM
const difficultySelection = document.getElementById('difficultySelection');
const gameZone = document.getElementById('gameZone');
const board = document.getElementById('board');
const player = document.getElementById('player');
const gameOver = document.getElementById('gameOver');
const resetBtn = document.getElementById('resetBtn');

// Initialisation
function init() {
    // Boutons de difficulté
    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            difficulty = e.target.getAttribute('data-difficulty');
            startGame();
        });
    });

    resetBtn.addEventListener('click', resetGame);
    board.addEventListener('click', handleCellClick);
}

// Démarrer le jeu
function startGame() {
    difficultySelection.style.display = 'none';
    gameZone.style.display = 'block';
    setGameActive(true);
    updateStatus(player, 'Vous (X)');
}

// Gestion du clic sur une case
function handleCellClick(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const cellIndex = parseInt(cell.getAttribute('data-index'));
    if (gameBoard[cellIndex] !== '' || !gameActive) return;

    // Joueur joue
    makeMove(board, cellIndex, playerSymbol, updateCell);

    // Vérifier si le joueur a gagné
    const winningCombination = checkWin(gameBoard, playerSymbol);
    if (winningCombination) {
        highlightWinningCells(board, winningCombination);
        endGame(gameOver, 'Vous avez gagné !');
        return;
    }

    // Vérifier l'égalité
    if (checkDraw(gameBoard)) return endGame(gameOver, 'Égalité !', true);

    // Tour de l'IA
    updateStatus(player, 'IA (O)');
    player.className = 'current-player player-o';
    setGameActive(false);

    setTimeout(() => {
        const aiMove = getAIMove(gameBoard, difficulty, aiSymbol, playerSymbol);
        makeMove(board, aiMove, aiSymbol, updateCell);

        const aiWinningCombination = checkWin(gameBoard, aiSymbol);
        if (aiWinningCombination) {
            highlightWinningCells(board, aiWinningCombination);
            endGame(gameOver, 'L\'IA a gagné !');
            return;
        }

        if (checkDraw(gameBoard)) return endGame(gameOver, 'Égalité !', true);

        setGameActive(true);
        updateStatus(player, 'Vous (X)');
        player.className = 'current-player';
    }, 500);
}

// Nouvelle partie
function resetGame() {
    resetGameState();
    setGameActive(false);

    // Nettoyer le plateau
    clearBoard(board);

    // Cacher le message de fin
    gameOver.classList.remove('show', 'draw');

    // Retour à la sélection de difficulté
    gameZone.style.display = 'none';
    difficultySelection.style.display = 'block';
    difficulty = null;
}

// Démarrer le jeu
document.addEventListener('DOMContentLoaded', init);