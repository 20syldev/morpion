import { updateCellClass, clearBoard, updateStatus } from './modules/board.js';

class Multiplayer {
    constructor() {
        this.username = '';
        this.gameCode = '';
        this.sessionId = '';
        this.isMyTurn = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.mySymbol = '';
        this.opponentSymbol = '';
        this.updateInterval = null;
        this.moves = [];
        this.foundMessageShown = false;
        this.isCopying = false;

        this.initializeElements();
        this.bindEvents();
        this.checkUrlParams();
    }

    initializeElements() {
        this.usernameInput = document.getElementById('username');
        this.gameCodeInput = document.getElementById('gameCode');
        this.startGameBtn = document.getElementById('startGame');
        this.gameSetup = document.getElementById('gameSetup');

        this.gameBoard = document.getElementById('gameBoard');
        this.gameStatus = document.getElementById('gameStatus');
        this.cells = document.querySelectorAll('.cell');
        this.newGameBtn = document.getElementById('newGame');
        this.gameCodeDisplay = document.getElementById('gameCodeDisplay');
        this.gameResult = document.querySelector('.game-result');
        this.board = document.querySelector('.board');
    }

    bindEvents() {
        this.startGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.startGame();
        });
        this.newGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetGame();
        });
        this.gameCodeDisplay.addEventListener('click', () => this.shareGame());

        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        this.gameCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });

        this.gameCodeInput.addEventListener('input', () => this.updateButtonText());

        this.updateButtonText();
    }

    updateButtonText() {
        const gameCode = this.gameCodeInput.value.trim();
        this.startGameBtn.textContent = gameCode ? 'Rejoindre la partie' : 'Créer une partie';
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameCode = urlParams.get('c');

        const savedUsername = localStorage.getItem('username');

        if (gameCode) {
            this.gameCodeInput.value = gameCode;
            this.updateButtonText();
        }

        if (savedUsername) {
            this.usernameInput.value = savedUsername;
        }

        if (gameCode && savedUsername) {
            setTimeout(() => this.startGame(), 100);
        }
    }

    updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('c', this.gameCode);
        window.history.replaceState({}, '', url);
    }

    shareGame() {
        const textToCopy = this.gameCode;
        this.isCopying = true;
        const originalText = this.gameCodeDisplay.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            this.gameCodeDisplay.innerHTML = '<i class="fa fa-check"></i>';
            setTimeout(() => {
                this.gameCodeDisplay.textContent = originalText;
                this.isCopying = false;
            }, 2500);
        }).catch(() => {
            const tempInput = document.createElement('input');
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);

            this.gameCodeDisplay.innerHTML = '<i class="fa fa-check"></i>';
            setTimeout(() => {
                this.gameCodeDisplay.textContent = originalText;
                this.isCopying = false;
            }, 2500);
        });
    }

    async startGame() {
        const username = this.usernameInput.value.trim();
        const gameCode = this.gameCodeInput.value.trim();

        if (!username) {
            this.usernameInput.style.borderColor = '#ff4444';
            this.usernameInput.focus();
            return;
        }

        this.username = username;
        this.gameCode = gameCode;

        const storedSessionId = localStorage.getItem(this.username.toLowerCase());
        if (storedSessionId) {
            this.sessionId = storedSessionId;
        } else {
            this.sessionId = this.generateSessionId();
            localStorage.setItem(this.username.toLowerCase(), this.sessionId);
        }

        localStorage.setItem('username', username);

        if (gameCode) {
            try {
                const response = await this.fetchGameState();
                if (response && response.id) {
                    this.gameStarted = true;
                    this.updateUrl();
                    this.showGameBoard();
                    this.updateGameState(response);
                    this.startPolling();
                    return;
                }
            } catch (error) {
                console.error('Erreur lors de la vérification de la partie:', error);
            }
        }

        // Créer une nouvelle partie
        this.gameStarted = true;
        this.updateUrl();
        this.showGameBoard();
        this.startPolling();
    }

    async initializeNewGame() {
        try {
            const response = await this.fetchGameState();
            this.gameStarted = true;
            this.showGameBoard();
            this.updateGameState(response);
            this.startPolling();
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            alert('Erreur lors de la création de la partie. Veuillez réessayer.');
        }
    }

    showGameBoard() {
        this.gameSetup.classList.add('is-hidden');
        this.gameBoard.classList.remove('is-hidden');
        if (this.gameCode) this.gameCodeDisplay.textContent = this.gameCode;
    }

    backToSetup() {
        this.stopPolling();
        this.gameBoard.classList.add('is-hidden');
        this.gameSetup.classList.remove('is-hidden');
        this.resetGameState();
    }

    resetGame() {
        this.stopPolling();
        this.resetGameState();
        window.location.href = '/multiplayer';
    }

    resetGameState() {
        this.isMyTurn = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.mySymbol = '';
        this.opponentSymbol = '';
        this.moves = [];
        this.foundMessageShown = false;
        this.gameResult.classList.add('is-hidden');
    }

    clearBoardUI() {
        clearBoard(this.board);
    }

    async handleCellClick(event) {
        if (!this.gameStarted || this.gameEnded || !this.isMyTurn) return;

        const cell = event.currentTarget;
        const position = cell.dataset.position;

        if (cell.classList.contains('cell--x') || cell.classList.contains('cell--o')) return;

        try {
            const success = await this.makeMove(position);
            if (success) {
                updateCellClass(cell, this.mySymbol);
                this.isMyTurn = false;
                updateStatus(this.gameStatus, 'En attente du joueur adverse...');
            }
        } catch (error) {
            console.error('Erreur lors du mouvement:', error);
        }
    }

    async makeMove(position) {
        try {
            const response = await fetch('https://api.sylvain.pro/v3/tic-tac-toe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(this.username.toLowerCase())}&move=${position}&session=${this.sessionId}&game=${this.gameCode}`
            });

            const data = await response.json();

            if (data.message) {
                return true;
            } else {
                console.error('Erreur API:', data);
                updateStatus(this.gameStatus, data.error || 'Erreur lors du mouvement');
                return false;
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            return false;
        }
    }

    async fetchGameState() {
        try {
            const response = await fetch('https://api.sylvain.pro/v3/tic-tac-toe/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(this.username.toLowerCase())}&game=${this.gameCode}`
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'état:', error);
            return null;
        }
    }

    updateGameState(gameData) {
        if (!gameData) return;

        if (gameData.id) {
            if (!this.gameCode) {
                this.gameCode = gameData.id;
                this.updateUrl();
            }
            if (this.gameCodeDisplay && !this.isCopying) {
                this.gameCodeDisplay.textContent = this.gameCode;
            }
        }

        const movesArray = gameData.moves || [];

        const movesByPlayer = {};
        movesArray.forEach(play => {
            if (!movesByPlayer[play.username]) {
                movesByPlayer[play.username] = [];
            }
            movesByPlayer[play.username].push(play.move);
        });

        this.updateBoard(movesByPlayer);

        const connectedPlayers = gameData.players;
        const players = Object.keys(movesByPlayer);

        const isSpectator = connectedPlayers.length > 2 && !connectedPlayers.slice(0, 2).includes(this.username.toLowerCase());

        if (connectedPlayers.length < 2) {
            this.isMyTurn = false;
            this.mySymbol = 'x';
            this.opponentSymbol = 'o';
            updateStatus(this.gameStatus, 'En attente d\'un autre joueur...');
            this.updateBoardHover(false);
        } else if (players.length === 0) {
            this.isMyTurn = connectedPlayers[0] === this.username.toLowerCase();
            this.mySymbol = this.isMyTurn ? 'x' : 'o';
            this.opponentSymbol = this.isMyTurn ? 'o' : 'x';

            if (isSpectator) {
                updateStatus(this.gameStatus, `Tour de ${connectedPlayers[0]} (X)`);
            } else {
                updateStatus(this.gameStatus, this.isMyTurn ? 'À votre tour !' : 'En attente du joueur adverse...');
            }
            this.updateBoardHover(isSpectator);
        } else if (players.length === 1) {
            if (players[0] === this.username.toLowerCase()) {
                this.isMyTurn = false;
                this.mySymbol = 'x';
                this.opponentSymbol = 'o';
                if (isSpectator) {
                    updateStatus(this.gameStatus, `Tour de ${connectedPlayers[1]} (O)`);
                } else {
                    updateStatus(this.gameStatus, 'En attente du joueur adverse...');
                }
                this.updateBoardHover(isSpectator);
            } else {
                this.isMyTurn = !isSpectator;
                this.mySymbol = 'o';
                this.opponentSymbol = 'x';
                if (isSpectator) {
                    updateStatus(this.gameStatus, `Tour de ${connectedPlayers[1]} (O)`);
                } else {
                    updateStatus(this.gameStatus, 'À votre tour !');
                }
                this.updateBoardHover(isSpectator);
            }
        } else {
            const myMoves = movesByPlayer[this.username.toLowerCase()] || [];
            const opponentName = players.find(p => p !== this.username.toLowerCase());
            const opponentMoves = movesByPlayer[opponentName] || [];

            if (players[0] === this.username.toLowerCase()) {
                this.mySymbol = 'x';
                this.opponentSymbol = 'o';
            } else {
                this.mySymbol = 'o';
                this.opponentSymbol = 'x';
            }

            let currentTurnIsX;
            if (players[0] === this.username.toLowerCase()) {
                currentTurnIsX = myMoves.length <= opponentMoves.length;
                this.isMyTurn = !isSpectator && currentTurnIsX;
            } else {
                currentTurnIsX = opponentMoves.length <= myMoves.length;
                this.isMyTurn = !isSpectator && !currentTurnIsX;
            }

            if (isSpectator) {
                const currentPlayer = currentTurnIsX ? connectedPlayers[0] : connectedPlayers[1];
                const currentSymbol = currentTurnIsX ? 'X' : 'O';
                updateStatus(this.gameStatus, `Tour de ${currentPlayer} (${currentSymbol})`);
            } else {
                updateStatus(this.gameStatus, this.isMyTurn ? 'À votre tour !' : 'En attente du joueur adverse...');
            }
        }

        this.updateBoardHover(isSpectator);

        if (gameData.winner) {
            this.handleGameEnd(gameData.winner);
        } else if (gameData.tie) {
            this.handleGameEnd('tie');
        }
    }

    updateBoard(movesByPlayer) {
        this.clearBoardUI();

        if (!movesByPlayer) return;

        const players = Object.keys(movesByPlayer);

        players.forEach(player => {
            const playerMoves = movesByPlayer[player] || [];
            const symbol = (players[0] === player) ? 'x' : 'o';

            playerMoves.forEach(move => {
                const cell = document.querySelector(`[data-position="${move}"]`);
                if (cell) {
                    updateCellClass(cell, symbol);
                }
            });
        });
    }

    updateBoardHover(isSpectator) {
        if (!this.board) return;

        this.board.classList.remove('player-o', 'spectator');

        if (isSpectator) {
            this.board.classList.add('spectator');
        } else if (this.isMyTurn && this.mySymbol === 'o') {
            this.board.classList.add('player-o');
        }
    }

    handleGameEnd(result) {
        this.gameEnded = true;
        this.stopPolling();

        let messageClass;

        if (result === 'tie') {
            messageClass = 'msg--draw';
        } else if (result === this.username.toLowerCase() || result === this.username) {
            messageClass = 'msg--win';
        } else {
            messageClass = 'msg--lose';
        }

        updateStatus(this.gameStatus, 'Partie terminée');
        this.gameResult.classList.remove('is-hidden');

        this.gameResult.querySelectorAll('.msg').forEach(msg => {
            msg.style.display = 'none';
        });

        const targetMsg = this.gameResult.querySelector(`.${messageClass}`);
        if (targetMsg) targetMsg.style.display = 'block';
    }

    startPolling() {
        this.stopPolling();
        this.updateInterval = setInterval(async () => {
            if (!this.gameEnded) {
                const gameData = await this.fetchGameState();
                if (gameData) this.updateGameState(gameData);
            }
        }, 2000);
    }

    stopPolling() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    generateSessionId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Multiplayer();
});