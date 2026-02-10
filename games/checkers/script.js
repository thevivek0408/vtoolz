class CheckersGame {
    constructor() {
        this.boardEl = document.getElementById('board');
        this.statusEl = document.getElementById('status');
        this.rows = 8;
        this.cols = 8;
        this.board = []; // 2D array: null, {color:'red'|'black', isKing:bool}
        this.turn = 'red'; // red starts
        this.selected = null; // {r, c}
        this.validMoves = []; // Array of {r, c, isJump, jumpR, jumpC}

        this.init();
    }

    init() {
        this.reset();
    }

    reset() {
        this.turn = 'red';
        this.selected = null;
        this.validMoves = [];
        this.createBoard();
        this.render();
        this.updateStatus();
    }

    createBoard() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));

        // Fill Red (rows 0, 1, 2)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) this.board[r][c] = { color: 'black', isKing: false }; // Black actually starts top logic-wise usually, let's stick to simple: Black Top, Red Bottom? 
                // Wait, standard: Red top?
                // Let's do: Black pieces at top (r=0-2), Red pieces at bottom (r=5-7)
            }
        }

        // Clear previous loop, let's respect standard
        // Black at top (0-2), Red at bottom (5-7)
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) {
                    if (r < 3) this.board[r][c] = { color: 'black', isKing: false };
                    if (r > 4) this.board[r][c] = { color: 'red', isKing: false };
                }
            }
        }
    }

    updateStatus() {
        this.statusEl.textContent = `${this.turn.charAt(0).toUpperCase() + this.turn.slice(1)}'s Turn`;
        this.statusEl.className = `status turn-${this.turn}`;
    }

    getValidMoves(r, c) {
        const piece = this.board[r][c];
        if (!piece) return [];

        const moves = [];
        const dirs = [];

        // Red moves UP (-1), Black moves DOWN (+1)
        if (piece.color === 'red' || piece.isKing) dirs.push([-1, -1], [-1, 1]); // Up Left, Up Right
        if (piece.color === 'black' || piece.isKing) dirs.push([1, -1], [1, 1]);   // Down Left, Down Right

        dirs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;

            // 1. Simple Move
            if (this.isValidPos(nr, nc) && this.board[nr][nc] === null) {
                moves.push({ r: nr, c: nc, isJump: false });
            }

            // 2. Jump
            const jr = r + dr * 2;
            const jc = c + dc * 2;
            if (this.isValidPos(jr, jc) && this.board[jr][jc] === null) {
                const midPiece = this.board[nr][nc];
                if (midPiece && midPiece.color !== piece.color) {
                    moves.push({ r: jr, c: jc, isJump: true, jumpR: nr, jumpC: nc });
                }
            }
        });

        return moves;
    }

    isValidPos(r, c) {
        return r >= 0 && r < 8 && c >= 0 && c < 8;
    }

    handleClick(r, c) {
        const clickedPiece = this.board[r][c];

        // If clicking a valid move square
        const move = this.validMoves.find(m => m.r === r && m.c === c);

        if (move) {
            this.executeMove(move);
            return;
        }

        // If clicking own piece, select it
        if (clickedPiece && clickedPiece.color === this.turn) {
            this.selected = { r, c };
            this.validMoves = this.getValidMoves(r, c);

            // Forced jump rule? Optional for lite version. 
            // We'll skip forced jumps for simplicity/fun.

            this.render();
        } else {
            // Deselect
            this.selected = null;
            this.validMoves = [];
            this.render();
        }
    }

    executeMove(move) {
        const piece = this.board[this.selected.r][this.selected.c];

        // Move piece
        this.board[move.r][move.c] = piece;
        this.board[this.selected.r][this.selected.c] = null;

        // Handle Jump Capture
        if (move.isJump) {
            this.board[move.jumpR][move.jumpC] = null;
        }

        // King Promotion
        if (piece.color === 'red' && move.r === 0) piece.isKing = true;
        if (piece.color === 'black' && move.r === 7) piece.isKing = true;

        // Switch turn (Multi-jump logic skipped for simplicity, single jump per turn)
        this.turn = this.turn === 'red' ? 'black' : 'red';
        this.selected = null;
        this.validMoves = [];

        this.render();
        this.updateStatus();
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const sq = document.createElement('div');
                const isBlackSq = (r + c) % 2 === 1;
                sq.className = `square ${isBlackSq ? 'black' : 'white'}`;

                // Highlight selected
                if (this.selected && this.selected.r === r && this.selected.c === c) {
                    sq.classList.add('selected');
                }

                // Highlight valid moves
                if (this.validMoves.some(m => m.r === r && m.c === c)) {
                    sq.classList.add('valid');
                    sq.onclick = () => this.handleClick(r, c);
                }

                const piece = this.board[r][c];
                if (piece) {
                    const pDiv = document.createElement('div');
                    pDiv.className = `piece ${piece.color === 'black' ? 'black-piece' : 'red'} ${piece.isKing ? 'king' : ''}`;
                    sq.appendChild(pDiv);

                    if (piece.color === this.turn) {
                        sq.onclick = () => this.handleClick(r, c);
                    }
                }

                this.boardEl.appendChild(sq);
            }
        }
    }
}

window.onload = () => {
    window.game = new CheckersGame();
};
