/**
 * Met à jour l'affichage d'une cellule avec un symbole
 *
 * @param {HTMLElement} cell - L'élément de la cellule
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
 * @param {HTMLElement} cell - L'élément de la cellule
 * @param {string} symbol - 'x' ou 'o' (minuscule)
 */
export function updateCellClass(cell, symbol) {
    cell.classList.add(`cell--${symbol}`);
}

/**
 * Nettoie toutes les cellules du plateau
 *
 * @param {HTMLElement} board - L'élément contenant le plateau
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
 * @param {HTMLElement} board - L'élément contenant le plateau
 * @param {Array} indices - Les indices des cellules gagnantes
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
 * @param {HTMLElement} element - L'élément où afficher le texte
 * @param {string} text - Le texte à afficher
 */
export function updateStatus(element, text) {
    if (element) {
        element.textContent = text;
    }
}