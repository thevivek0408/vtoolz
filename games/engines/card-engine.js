export default class CardEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.running = false;

        // Card constants
        this.cardWidth = 80;
        this.cardHeight = 120;
        this.cardSpacing = 20;

        // Game State (Solitaire)
        this.deck = [];
        this.piles = [[], [], [], [], [], [], []]; // 7 Tableau piles
        this.foundations = [[], [], [], []]; // 4 Foundation piles (Hearts, Diamonds, Clubs, Spades)
        this.stock = [];
        this.waste = [];

        this.draggedCard = null;
        this.dragStart = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };

        // Resize
        window.addEventListener('resize', () => this.resize());

        // Input
        this.setupInput();
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientHeight;
        }

        // Responsiveness
        const cols = 7;
        const totalSpace = this.canvas.width;
        // Max card width based on screen width
        this.cardWidth = Math.min(80, (totalSpace - (cols + 1) * 10) / cols);
        this.cardHeight = this.cardWidth * 1.5;
        this.cardSpacing = this.cardWidth * 0.2;

        this.draw();
    }

    setupInput() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startDrag = (e) => {
            const pos = getPos(e);
            // Check top cards of piles, waste, etc.
            // Simplified hit testing...
            // Check Waste top card
            if (this.waste.length > 0) {
                const card = this.waste[this.waste.length - 1];
                if (this.hitTest(pos, card)) {
                    this.draggedCard = { card: card, type: 'waste', originIndex: this.waste.length - 1 };
                    this.dragOffset = { x: pos.x - card.x, y: pos.y - card.y };
                    return;
                }
            }

            // Check Tableau Piles (allow dragging sequences)
            for (let i = 0; i < 7; i++) {
                const pile = this.piles[i];
                for (let j = pile.length - 1; j >= 0; j--) {
                    const card = pile[j];
                    if (!card.faceUp) continue; // Logic check: can only drag face up

                    if (this.hitTest(pos, card)) {
                        // Drag stack logic later?
                        // For MVP, just drag single card from top
                        if (j === pile.length - 1) {
                            this.draggedCard = { card: card, type: 'tableau', pileIndex: i, cardIndex: j };
                            this.dragOffset = { x: pos.x - card.x, y: pos.y - card.y };
                            return;
                        }
                    }
                }
            }

            // Stock Click (Deal)
            if (this.hitTestRect(pos, 10, 10, this.cardWidth, this.cardHeight)) {
                this.dealStock();
                this.draw();
            }
        };

        const moveDrag = (e) => {
            if (!this.draggedCard) return;
            e.preventDefault();
            const pos = getPos(e);
            this.draggedCard.card.x = pos.x - this.dragOffset.x;
            this.draggedCard.card.y = pos.y - this.dragOffset.y;
            this.draw();
        };

        const endDrag = (e) => {
            if (!this.draggedCard) return;
            const card = this.draggedCard.card;

            // 1. Check Drop on Foundations
            let dropped = false;
            // ... Logic for dropping ...

            // If invalid drop, return to origin
            if (!dropped) {
                // Return animation or snap
                this.layout(); // Re-calculate positions
            }

            this.draggedCard = null;
            this.draw();
        };

        this.canvas.addEventListener('mousedown', startDrag);
        this.canvas.addEventListener('mousemove', moveDrag);
        window.addEventListener('mouseup', endDrag);

        this.canvas.addEventListener('touchstart', startDrag, { passive: false });
        this.canvas.addEventListener('touchmove', moveDrag, { passive: false });
        window.addEventListener('touchend', endDrag);
    }

    start() {
        this.running = true;
        this.initSolitaire();
        this.resize();
    }

    initSolitaire() {
        // Create 52 cards
        const suits = ['♥', '♦', '♣', '♠']; // Hearts, Diamonds, Clubs, Spades
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];

        for (let s = 0; s < 4; s++) {
            for (let v = 0; v < 13; v++) {
                this.deck.push({
                    suit: suits[s],
                    value: values[v],
                    color: (s < 2) ? 'red' : 'black',
                    faceUp: false,
                    x: 0, y: 0
                });
            }
        }

        // Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }

        // Deal logic
        let cardIdx = 0;
        this.piles = [[], [], [], [], [], [], []];

        for (let i = 0; i < 7; i++) {
            for (let j = 0; j <= i; j++) {
                const card = this.deck[cardIdx++];
                if (j === i) card.faceUp = true;
                this.piles[i].push(card);
            }
        }

        this.stock = this.deck.slice(cardIdx);
        this.waste = [];
        this.foundations = [[], [], [], []]; // Hearts, Diamonds, Clubs, Spades

        this.layout();
    }

    dealStock() {
        if (this.stock.length === 0) {
            // Recycle waste
            this.stock = this.waste.reverse().map(c => { c.faceUp = false; return c; });
            this.waste = [];
        } else {
            const card = this.stock.pop();
            card.faceUp = true;
            this.waste.push(card);
        }
    }

    hitTest(pos, card) {
        return pos.x >= card.x && pos.x <= card.x + this.cardWidth &&
            pos.y >= card.y && pos.y <= card.y + this.cardHeight;
    }

    hitTestRect(pos, x, y, w, h) {
        return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
    }

    layout() {
        // Position cards based on state
        const startX = 10;
        const startY = 150; // below stock/waste
        const gap = this.cardWidth + 10;

        // Piles
        for (let i = 0; i < 7; i++) {
            let y = startY;
            this.piles[i].forEach((card, idx) => {
                if (this.draggedCard && this.draggedCard.card === card) return; // Don't reset pos if dragging
                card.x = startX + i * gap;
                card.y = y;
                y += (card.faceUp ? 30 : 10); // Compact overlap
            });
        }

        // Stock
        this.stock.forEach(c => { c.x = 10; c.y = 10; });

        // Waste
        if (this.waste.length > 0) {
            const top = this.waste[this.waste.length - 1];
            if (!this.draggedCard || this.draggedCard.card !== top) {
                top.x = 10 + this.cardWidth + 20;
                top.y = 10;
            }
        }

        // Foundations
        for (let i = 0; i < 4; i++) {
            const x = this.canvas.width - 10 - (4 - i) * (this.cardWidth + 10);
            this.foundations[i].forEach(c => {
                if (this.draggedCard && this.draggedCard.card === c) return;
                c.x = x;
                c.y = 10;
            });
        }
    }

    draw() {
        this.ctx.fillStyle = '#27ae60'; // Green felt
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Placeholders
        // Stock
        this.drawCardPlaceholder(10, 10);
        // Waste
        this.drawCardPlaceholder(10 + this.cardWidth + 20, 10);

        // Foundations
        for (let i = 0; i < 4; i++) {
            const x = this.canvas.width - 10 - (4 - i) * (this.cardWidth + 10);
            this.drawCardPlaceholder(x, 10, true); // limit hints?
        }

        // Draw Cards (Z-index handled by order)
        // Draw Piles (Tableau)
        for (let i = 0; i < 7; i++) {
            this.piles[i].forEach(c => this.drawCard(c));
        }

        // Draw Foundations
        this.foundations.forEach(pile => {
            pile.forEach(c => this.drawCard(c));
        });

        // Draw Stock (top only)
        if (this.stock.length > 0) {
            this.drawCard(this.stock[this.stock.length - 1]); // Face down
        }

        // Draw Waste (top only)
        if (this.waste.length > 0) {
            this.drawCard(this.waste[this.waste.length - 1]);
        }

        // Draw Dragged Card on top
        if (this.draggedCard) {
            this.drawCard(this.draggedCard.card, true);
        }
    }

    drawCardPlaceholder(x, y, isFoundation) {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, this.cardWidth, this.cardHeight, 5);
        this.ctx.stroke();
        if (isFoundation) {
            this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this.ctx.textAlign = 'center';
            this.ctx.font = '20px Arial';
            this.ctx.fillText("A", x + this.cardWidth / 2, y + this.cardHeight / 2);
        }
    }

    drawCard(card, shadow = false) {
        if (!card) return;

        this.ctx.save();
        this.ctx.translate(card.x, card.y);

        if (shadow) {
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;
        }

        this.ctx.fillStyle = card.faceUp ? 'white' : '#3498db'; // Front vs Back
        this.ctx.beginPath();
        this.ctx.roundRect(0, 0, this.cardWidth, this.cardHeight, 5);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ccc';
        this.ctx.stroke();

        this.ctx.shadowColor = 'transparent'; // Reset shadow for text

        if (card.faceUp) {
            this.ctx.fillStyle = card.color;
            this.ctx.textAlign = 'left';
            this.ctx.font = `${this.cardWidth * 0.3}px Arial`;
            this.ctx.fillText(card.value, 5, this.cardWidth * 0.35);
            this.ctx.fillText(card.suit, 5, this.cardWidth * 0.7);

            // Center Big Suit
            this.ctx.textAlign = 'center';
            this.ctx.font = `${this.cardWidth * 0.6}px Arial`;
            this.ctx.fillText(card.suit, this.cardWidth / 2, this.cardHeight / 2 + 10);

            // Bottom Right (Rotating 180 is hard with simple fillText, skipping for now)
        } else {
            // Back Pattern
            this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.ctx.fillRect(5, 5, this.cardWidth - 10, this.cardHeight - 10);
        }

        this.ctx.restore();
    }

    // Stub
    bindMobileControls() { }
}
