// Combinaisons gagnantes du morpion
export const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

/**
 * Vérifie si un symbole a gagné la partie
 *
 * @param {Array} board - Le plateau de jeu
 * @param {string} symbol - Le symbole à vérifier ('X' ou 'O')
 * @returns {Array|null} - Les indices de la combinaison gagnante ou null
 */
export function checkWin(board, symbol) {
    for (let condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
            return condition;
        }
    }
    return null;
}

/**
 * Vérifie si la partie est une égalité
 *
 * @param {Array} board - Le plateau de jeu
 * @returns {boolean}
 */
export function checkDraw(board) {
    return board.every(cell => cell !== '');
}

/**
 * Convertit une position du format "row-col" en index (0-8)
 *
 * @param {string} position - Position au format "1-1" à "3-3"
 * @returns {number} - Index de 0 à 8
 */
export function positionToIndex(position) {
    const [row, col] = position.split('-').map(Number);
    return (row - 1) * 3 + (col - 1);
}

/**
 * Convertit un index (0-8) en position "row-col"
 *
 * @param {number} index - Index de 0 à 8
 * @returns {string} - Position au format "1-1" à "3-3"
 */
export function indexToPosition(index) {
    const row = Math.floor(index / 3) + 1;
    const col = (index % 3) + 1;
    return `${row}-${col}`;
}