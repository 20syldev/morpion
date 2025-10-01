/**
 * Met à jour l'affichage d'une cellule avec un symbole
 *
 * @param {HTMLElement} cell - Élément de la cellule
 * @param {string} symbol - 'X' ou 'O'
 */
export function updateCell(cell, symbol) {
    const mark = document.createElement('div');
    mark.className = `mark ${symbol.toLowerCase()}`;
    cell.innerHTML = '';
    cell.appendChild(mark);
    cell.classList.add('occupied');
}

/**
 * Met à jour l'affichage d'une cellule avec les classes CSS
 *
 * @param {HTMLElement} cell - Élément de la cellule
 * @param {string} symbol - 'x' ou 'o' (minuscule)
 */
export function updateCellClass(cell, symbol) {
    cell.classList.add(`cell--${symbol}`);
}

/**
 * Nettoie toutes les cellules du plateau
 *
 * @param {HTMLElement} board - Élément contenant le plateau
 */
export function clearBoard(board) {
    const cells = board.querySelectorAll('.cell');
    cells.forEach(cell => {
        const hasInternalMarks = cell.querySelector('.mark--x') !== null;

        if (hasInternalMarks) {
            cell.classList.remove('occupied', 'winning', 'cell--x', 'cell--o');
        } else {
            cell.innerHTML = '';
            cell.classList.remove('occupied', 'winning', 'cell--x', 'cell--o');
        }
    });
}

/**
 * Met en surbrillance les cellules gagnantes
 *
 * @param {HTMLElement} board - Élément contenant le plateau
 * @param {Array} indices - Indices des cellules gagnantes
 */
export function highlightWinningCells(board, indices) {
    const cells = Array.from(board.children).filter(el => el.classList.contains('cell'));
    indices.forEach(index => {
        if (cells[index]) {
            cells[index].classList.add('winning');
        }
    });
}

/**
 * Met à jour l'affichage du joueur actuel
 *
 * @param {HTMLElement} el - Élément où afficher le texte
 * @param {string} text - Texte à afficher
 */
export function updateStatus(el, text) {
    if (el) el.textContent = text;
}