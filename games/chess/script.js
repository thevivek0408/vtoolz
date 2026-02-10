class ChessGame {
    constructor() {
        this.boardEl = document.getElementById('board');
        this.statusEl = document.getElementById('status');
        this.selectedSquare = null;
        this.turn = 'white'; // white, black

        // 8x8 representation. 
        // lowercase = black, uppercase = white
        // p/P=pawn, r/R=rook, n/N=knight, b/B=bishop, q/Q=queen, k/K=king
        this.initialState = [
            ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
            ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
            ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
        ];

        this.pieces = {
            'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
            'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
        };

        this.state = [];
        this.reset();
    }

    reset() {
        this.state = JSON.parse(JSON.stringify(this.initialState));
        this.turn = 'white';
        this.selectedSquare = null;
        this.render();
        this.updateStatus();
    }

    updateStatus() {
        this.statusEl.textContent = `${this.turn.charAt(0).toUpperCase() + this.turn.slice(1)}'s Turn`;
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = document.createElement('div');
                const isBlackSq = (r + c) % 2 === 1;
                square.className = `square ${isBlackSq ? 'black' : 'white'}`;
                square.dataset.r = r;
                square.dataset.c = c;

                if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
                    square.classList.add('selected');
                }

                const pieceCode = this.state[r][c];
                if (pieceCode) {
                    square.textContent = this.pieces[pieceCode];
                    const isWhitePiece = pieceCode === pieceCode.toUpperCase();
                    square.classList.add(isWhitePiece ? 'white-piece' : 'black-piece');
                }

                square.onclick = () => this.handleSquareClick(r, c, pieceCode);
                this.boardEl.appendChild(square);
            }
        }
    }

    handleSquareClick(r, c, pieceCode) {
        // Deselect if clicking same
        if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
            this.selectedSquare = null;
            this.render();
            return;
        }

        // If a piece is selected, try to move to this square
        if (this.selectedSquare) {
            // Check if it's a valid capture or move
            // Logic: Is it capturing own piece?
            const fromPiece = this.state[this.selectedSquare.r][this.selectedSquare.c];
            const isWhiteTurn = this.turn === 'white';
            const isWhitePiece = fromPiece === fromPiece.toUpperCase();

            // Cannot select opponent piece to move (Enforce turn)
            if (isWhiteTurn !== isWhitePiece) {
                // Wrong turn selected initially?? Should have been caught below.
                this.selectedSquare = null;
                this.render();
                return;
            }

            // Target check
            if (pieceCode) {
                const isTargetWhite = pieceCode === pieceCode.toUpperCase();
                if (isWhitePiece === isTargetWhite) {
                    // Clicked own piece -> Simply change selection
                    this.selectedSquare = { r, c };
                    this.render();
                    return;
                }
            }

            // Move! (Simplified, no rule validation for this phase)
            this.state[r][c] = fromPiece;
            this.state[this.selectedSquare.r][this.selectedSquare.c] = null;

            this.selectedSquare = null;
            this.turn = this.turn === 'white' ? 'black' : 'white';
            this.render();
            this.updateStatus();
        } else {
            // Selecting a piece
            if (!pieceCode) return; // Empty

            const isWhitePiece = pieceCode === pieceCode.toUpperCase();
            if ((this.turn === 'white' && isWhitePiece) || (this.turn === 'black' && !isWhitePiece)) {
                this.selectedSquare = { r, c };
                this.render();
            }
        }
    }
}

window.onload = () => {
    window.game = new ChessGame();
};
