import { checkWin, checkDraw } from './logic.js';

/**
 * Obtient un coup aléatoire parmi les cases disponibles
 *
 * @param {Array} board - Le plateau de jeu
 * @returns {number} - L'index de la case choisie
 */
export function getRandomMove(board) {
    const availableMoves = board
        .map((cell, index) => cell === '' ? index : null)
        .filter(index => index !== null);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}

/**
 * Obtient le meilleur coup en utilisant l'algorithme minimax
 *
 * @param {Array} board - Le plateau de jeu
 * @param {string} aiSymbol - Le symbole de l'IA
 * @param {string} playerSymbol - Le symbole du joueur
 * @returns {number} - L'index de la meilleure case
 */
export function getBestMove(board, aiSymbol, playerSymbol) {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = aiSymbol;
            let score = minimax(board, 0, false, aiSymbol, playerSymbol);
            board[i] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}

/**
 * Algorithme Minimax pour trouver le meilleur coup
 *
 * @param {Array} board - Le plateau de jeu
 * @param {number} depth - La profondeur actuelle dans l'arbre de recherche
 * @param {boolean} isMaximizing - Si c'est le tour de l'IA (maximisant)
 * @param {string} aiSymbol - Le symbole de l'IA
 * @param {string} playerSymbol - Le symbole du joueur
 * @returns {number} - Le score du coup
 */
function minimax(board, depth, isMaximizing, aiSymbol, playerSymbol) {
    if (checkWin(board, aiSymbol)) return 10 - depth;
    if (checkWin(board, playerSymbol)) return depth - 10;
    if (checkDraw(board)) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = aiSymbol;
                let score = minimax(board, depth + 1, false, aiSymbol, playerSymbol);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = playerSymbol;
                let score = minimax(board, depth + 1, true, aiSymbol, playerSymbol);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

/**
 * Obtient le coup de l'IA selon la difficulté
 *
 * @param {Array} board - Le plateau de jeu
 * @param {string} difficulty - 'easy', 'normal' ou 'hard'
 * @param {string} aiSymbol - Le symbole de l'IA
 * @param {string} playerSymbol - Le symbole du joueur
 * @returns {number} - L'index de la case choisie
 */
export function getAIMove(board, difficulty, aiSymbol, playerSymbol) {
    if (difficulty === 'easy') {
        return getRandomMove(board);
    } else if (difficulty === 'normal') {
        // 20% aléatoire, 80% intelligent
        return Math.random() < 0.2 ? getRandomMove(board) : getBestMove(board, aiSymbol, playerSymbol);
    } else {
        return getBestMove(board, aiSymbol, playerSymbol);
    }
}