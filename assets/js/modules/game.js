// État du jeu partagé
export let gameBoard = ['', '', '', '', '', '', '', '', ''];
export let gameActive = true;

// Réinitialiser l'état du jeu
export function resetGameState() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    return gameBoard;
}

// Définir l'état actif du jeu
export function setGameActive(active) {
    gameActive = active;
}

// Placer un symbole sur le plateau
export function makeMove(board, index, symbol, updateCellFn) {
    gameBoard[index] = symbol;
    const cell = board.children[index];
    updateCellFn(cell, symbol);
}

// Fin de partie
export function endGame(gameOverElement, message, isDraw = false) {
    gameActive = false;
    gameOverElement.textContent = message;
    gameOverElement.classList.add('show');
    if (isDraw) gameOverElement.classList.add('draw');
}