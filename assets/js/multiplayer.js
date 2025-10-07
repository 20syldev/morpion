import { updateCellClass, clearBoard, updateStatus } from './modules/board.js';

class Multiplayer {
    constructor() {
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
        this.spectator = false;

        this.initializeElements();
        this.bindEvents();
        this.checkUrlParams();
    }

    initializeElements() {
        this.user = document.getElementById('user');
        this.code = document.getElementById('code');
        this.private = document.getElementById('private');
        this.startBtn = document.getElementById('startGame');
        this.setup = document.getElementById('gameSetup');

        this.game = document.getElementById('gameBoard');
        this.status = document.getElementById('gameStatus');
        this.cells = document.querySelectorAll('.cell');
        this.newBtn = document.getElementById('newGame');
        this.codeDisplay = document.getElementById('gameCodeDisplay');
        this.result = document.querySelector('.game-result');
        this.board = document.querySelector('.board');

        this.gameList = document.getElementById('gameList');
        this.publicList = document.getElementById('publicList');
        this.listBtn = document.getElementById('listBtn');
        this.backBtn = document.getElementById('backBtn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.startGame();
        });
        this.newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.resetGame();
        });
        this.codeDisplay.addEventListener('click', () => this.shareGame());

        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        this.user.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        this.code.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });

        this.code.addEventListener('input', () => this.updateButtonText());

        this.listBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPublicGames();
        });

        this.backBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hidePublicGames();
        });

        this.updateButtonText();
    }

    updateButtonText() {
        const gameCode = this.code.value.trim();
        this.startBtn.textContent = gameCode ? 'Rejoindre la partie' : 'Créer une partie';
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const gameCode = urlParams.get('c');

        const savedUsername = localStorage.getItem('username');

        if (gameCode) {
            this.code.value = gameCode;
            this.updateButtonText();
        }

        if (savedUsername) {
            this.user.value = savedUsername;
        }

        if (gameCode && savedUsername) {
            setTimeout(() => this.startGame(), 100);
        }
    }

    updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('c', this.code.value);
        window.history.replaceState({}, '', url);
    }

    shareGame() {
        const textToCopy = this.code.value;
        this.isCopying = true;
        const originalText = this.codeDisplay.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            this.codeDisplay.innerHTML = '<i class="fa fa-check"></i>';
            setTimeout(() => {
                this.codeDisplay.textContent = originalText;
                this.isCopying = false;
            }, 2500);
        }).catch(() => {
            const tempInput = document.createElement('input');
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);

            this.codeDisplay.innerHTML = '<i class="fa fa-check"></i>';
            setTimeout(() => {
                this.codeDisplay.textContent = originalText;
                this.isCopying = false;
            }, 2500);
        });
    }

    async startGame() {
        const username = this.user.value.trim();
        const gameCode = this.code.value.trim();

        if (!username) return this.user.focus();

        const storedSessionId = localStorage.getItem(username);
        if (storedSessionId) {
            this.sessionId = storedSessionId;
        } else {
            this.sessionId = this.generateSessionId();
            localStorage.setItem(this.user.value, this.sessionId);
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
        this.setup.classList.add('is-hidden');
        this.game.classList.remove('is-hidden');
        if (this.code.value) this.codeDisplay.textContent = this.code.value;
    }

    backToSetup() {
        this.stopPolling();
        this.game.classList.add('is-hidden');
        this.setup.classList.remove('is-hidden');
        this.resetGameState();
    }

    resetGame() {
        this.stopPolling();
        this.resetGameState();
        this.clearBoardUI();
        this.backToSetup();
    }

    resetGameState() {
        this.isMyTurn = false;
        this.gameStarted = false;
        this.gameEnded = false;
        this.mySymbol = '';
        this.opponentSymbol = '';
        this.moves = [];
        this.foundMessageShown = false;
        this.result.classList.add('is-hidden');
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
                updateStatus(this.status, 'En attente du joueur adverse...');
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
                body: `username=${encodeURIComponent(this.user.value)}&move=${position}&session=${this.sessionId}&game=${this.code.value}`
            });

            const data = await response.json();

            if (data.message) {
                return true;
            } else {
                console.error('Erreur API:', data);
                updateStatus(this.status, data.error || 'Erreur lors du mouvement');
                return false;
            }
        } catch (error) {
            console.error('Erreur réseau:', error);
            return false;
        }
    }

    async fetchGameState() {
        try {
            const isPrivate = this.private?.checked ? 'true' : '';
            const response = await fetch('https://api.sylvain.pro/v3/tic-tac-toe/fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(this.user.value)}&game=${this.code.value}${isPrivate ? '&private=true' : ''}`
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
            if (!this.code.value) {
                this.code.value = gameData.id;
                this.updateUrl();
            }
            if (this.codeDisplay && !this.isCopying) {
                this.codeDisplay.textContent = this.code.value;
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

        this.spectator = connectedPlayers.length > 2 && !connectedPlayers.slice(0, 2).includes(this.user.value);

        if (connectedPlayers.length < 2) {
            this.isMyTurn = false;
            this.mySymbol = 'x';
            this.opponentSymbol = 'o';
            updateStatus(this.status, 'En attente d\'un autre joueur...');
            this.updateBoardHover(false);
        } else if (players.length === 0) {
            this.isMyTurn = connectedPlayers[0] === this.user.value;
            this.mySymbol = this.isMyTurn ? 'x' : 'o';
            this.opponentSymbol = this.isMyTurn ? 'o' : 'x';

            if (this.spectator) {
                updateStatus(this.status, `Tour de ${connectedPlayers[0]} (X)`);
            } else if (this.isMyTurn) {
                updateStatus(this.status, 'À votre tour !');
            } else {
                updateStatus(this.status, `En attente du premier coup de ${connectedPlayers[0]}...`);
            }
            this.updateBoardHover(this.spectator);
        } else if (players.length === 1) {
            if (players[0] === this.user.value) {
                this.isMyTurn = false;
                this.mySymbol = 'x';
                this.opponentSymbol = 'o';
                if (this.spectator) {
                    updateStatus(this.status, `Tour de ${connectedPlayers[1]} (O)`);
                } else {
                    updateStatus(this.status, 'En attente du joueur adverse...');
                }
                this.updateBoardHover(this.spectator);
            } else {
                this.isMyTurn = !this.spectator;
                this.mySymbol = 'o';
                this.opponentSymbol = 'x';
                if (this.spectator) {
                    updateStatus(this.status, `Tour de ${connectedPlayers[1]} (O)`);
                } else {
                    updateStatus(this.status, 'À votre tour !');
                }
                this.updateBoardHover(this.spectator);
            }
        } else {
            const myMoves = movesByPlayer[this.user.value] || [];
            const opponentName = players.find(p => p !== this.user.value);
            const opponentMoves = movesByPlayer[opponentName] || [];

            if (players[0] === this.user.value) {
                this.mySymbol = 'x';
                this.opponentSymbol = 'o';
            } else {
                this.mySymbol = 'o';
                this.opponentSymbol = 'x';
            }

            let currentTurnIsX;
            if (players[0] === this.user.value) {
                currentTurnIsX = myMoves.length <= opponentMoves.length;
                this.isMyTurn = !this.spectator && currentTurnIsX;
            } else {
                currentTurnIsX = opponentMoves.length <= myMoves.length;
                this.isMyTurn = !this.spectator && !currentTurnIsX;
            }

            if (this.spectator) {
                const currentPlayer = currentTurnIsX ? connectedPlayers[0] : connectedPlayers[1];
                const currentSymbol = currentTurnIsX ? 'X' : 'O';
                updateStatus(this.status, `Tour de ${currentPlayer} (${currentSymbol})`);
            } else {
                updateStatus(this.status, this.isMyTurn ? 'À votre tour !' : 'En attente du joueur adverse...');
            }
        }

        this.updateBoardHover(this.spectator);

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

    updateBoardHover(spectator) {
        if (!this.board) return;

        this.board.classList.remove('player-o', 'spectator');

        if (spectator) {
            this.board.classList.add('spectator');
        } else if (this.isMyTurn && this.mySymbol === 'o') {
            this.board.classList.add('player-o');
        }
    }

    handleGameEnd(result) {
        this.gameEnded = true;
        this.stopPolling();

        this.result.querySelectorAll('.msg').forEach(msg => {
            msg.style.display = 'none';
        });

        if (this.spectator) {
            if (result === 'tie') {
                updateStatus(this.status, 'Partie terminée - Égalité !');
                const drawMsg = this.result.querySelector('.msg--draw');
                if (drawMsg) drawMsg.style.display = 'block';
            } else {
                const winnerName = result.charAt(0).toUpperCase() + result.slice(1);
                updateStatus(this.status, `${winnerName} a gagné !`);
                let spectatorMsg = this.result.querySelector('.msg--spectator');
                if (!spectatorMsg) {
                    spectatorMsg = document.createElement('span');
                    spectatorMsg.className = 'msg msg--spectator';
                    this.result.appendChild(spectatorMsg);
                }
                spectatorMsg.textContent = `${winnerName} a gagné !`;
                spectatorMsg.style.display = 'block';
            }
        } else {
            let messageClass;
            if (result === 'tie') {
                messageClass = 'msg--draw';
            } else if (result === this.user.value) {
                messageClass = 'msg--win';
            } else {
                messageClass = 'msg--lose';
            }

            updateStatus(this.status, 'Partie terminée');
            const targetMsg = this.result.querySelector(`.${messageClass}`);
            if (targetMsg) targetMsg.style.display = 'block';
        }

        this.result.classList.remove('is-hidden');
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

    async showPublicGames() {
        if (!this.user.value.trim()) return this.user.focus();

        this.setup.classList.add('is-hidden');
        this.gameList.classList.remove('is-hidden');

        const games = await this.fetchPublicGames();
        this.displayPublicGames(games);
    }

    hidePublicGames() {
        this.gameList.classList.add('is-hidden');
        this.setup.classList.remove('is-hidden');
    }

    async fetchPublicGames() {
        try {
            const response = await fetch('https://api.sylvain.pro/v3/tic-tac-toe/list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            const data = await response.json();
            return data.games || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des parties publiques:', error);
            return [];
        }
    }

    displayPublicGames(games) {
        if (!this.publicList) return;
        if (games.length === 0) return this.publicList.innerHTML = '<p class="has-text-centered">Aucune partie publique disponible pour le moment.</p>';

        this.publicList.innerHTML = games.map(game => `
            <div class="game-item">
                <div class="game-item-info">
                    <strong>Code: ${game.id}</strong>
                    <span>${game.playersCount}/2 joueurs</span>
                    <span>${game.moves} coups</span>
                    <span class="${game.status === 'ready' ? 'status-ready' : 'status-waiting'}">
                        ${game.status === 'ready' ? 'En cours' : 'En attente'}
                    </span>
                </div>
                <button type="button" class="btn" data-game-id="${game.id}">
                    ${game.playersCount >= 2 ? 'Regarder' : 'Rejoindre'}
                </button>
            </div>
        `).join('');

        this.publicList.querySelectorAll('.btn[data-game-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.joinGame(btn.dataset.gameId);
            });
        });
    }

    joinGame(gameId) {
        this.code.value = gameId;
        this.updateButtonText();
        this.hidePublicGames();

        setTimeout(() => this.startGame(), 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Multiplayer();
});