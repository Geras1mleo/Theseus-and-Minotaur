function getDimensions(tiles) {
    const maxX = Math.max(...(tiles.map(t => t.x)));
    const maxY = Math.max(...(tiles.map(t => t.y)));
    return [maxX + 1, maxY + 1];
}

const animateMoveOptions = {
    duration: 150,
    easing: "ease-in-out",
    fill: "forwards",
    delay: 0,
};

export class GameView {

    tileWidth = 100;
    tileHeight = 100;
    borderOffset = 10;

    constructor(args, gameBoxId, canvasId, theseusId, minotaurId, exitLabelId) {
        this.gameBox = document.getElementById(gameBoxId);
        this.canvas = document.getElementById(canvasId);
        this.canvas_context = this.canvas.getContext("2d");
        this.theseus = document.getElementById(theseusId);
        this.minotaur = document.getElementById(minotaurId);
        this.exitLabel = document.getElementById(exitLabelId);

        this.canvas_context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.setLayoutProperties(args.tiles, args.exit);
        this.setPoints(args.theseus, args.minotaur, args.exit);

        this.gameBox.style.visibility = 'visible';
    }

    setPoints(theseusCoord, minotaurCoord, exitCoord) {
        const elements = [
            [this.theseus, theseusCoord],
            [this.minotaur, minotaurCoord],
            [this.exitLabel, exitCoord],
        ];
        for (const [element, coordinate] of elements) {
            this.animateElement(element, coordinate);
        }
    }

    getAbsoluteLeft(element, coordinate) {
        return coordinate.x * this.tileWidth + this.borderOffset + (this.tileWidth - element.clientWidth) / 2.3;
    }

    getAbsoluteTop(element, coordinate) {
        return coordinate.y * this.tileHeight + this.borderOffset + (this.tileHeight - element.clientHeight) / 2.3;
    }

    setLayoutProperties(tiles, exitCoordinates) {
        const [xDim, yDim] = getDimensions(tiles);

        this.canvas.style.width = `${this.tileWidth * xDim + this.borderOffset * 2}px`;
        this.canvas.style.height = `${this.tileHeight * yDim + this.borderOffset * 2}px`;
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.theseus.style.width = `${this.tileWidth * 0.75}px`;
        this.theseus.style.height = `${this.tileHeight * 0.75}px`;

        this.minotaur.style.width = `${this.tileWidth * 0.75}px`;
        this.minotaur.style.height = `${this.tileHeight * 0.75}px`;

        this.setBackgroundGrid(xDim, yDim, exitCoordinates);

        this.canvas_context.lineWidth = 5;
        this.canvas_context.strokeStyle = "#7777ff";
        this.canvas_context.lineCap = "round";
        this.canvas_context.lineJoin = "round";

        for (const tile of tiles) {
            this.setBorders(tile);
        }
    }

    setBackgroundGrid(xDim, yDim, exitCoordinates) {
        this.canvas_context.lineWidth = 0.5;
        this.canvas_context.strokeStyle = "#c6b3b3";

        const fromX = exitCoordinates.x === 0 ? 1 : 0;
        const fromY = exitCoordinates.y === 0 ? 1 : 0;
        const toX = xDim - (exitCoordinates.x === xDim - 1 ? 1 : 0);
        const toY = yDim - (exitCoordinates.y === yDim - 1 ? 1 : 0);

        const fromXCoord = fromX * this.tileWidth + this.borderOffset;
        const fromYCoord = fromY * this.tileHeight + this.borderOffset;
        const toXCoord = toX * this.tileWidth + this.borderOffset;
        const toYCoord = toY * this.tileHeight + this.borderOffset;

        this.canvas_context.beginPath();
        for (let i = fromX; i <= toX; i++) {
            const x = this.tileWidth * i + this.borderOffset;
            this.canvas_context.moveTo(x, fromYCoord);
            this.canvas_context.lineTo(x, toYCoord);
        }

        for (let i = fromY; i <= toY; i++) {
            const y = this.tileHeight * i + this.borderOffset;
            this.canvas_context.moveTo(fromXCoord, y);
            this.canvas_context.lineTo(toXCoord, y);
        }
        this.canvas_context.stroke();
    }

    setBorders(tile) {
        if (tile.left || tile.top) {
            this.canvas_context.beginPath();
            const leftX = this.tileWidth * tile.x + this.borderOffset;
            const leftY = this.tileHeight * tile.y + this.borderOffset;
            if (tile.left) {
                this.canvas_context.moveTo(leftX, leftY);
                this.canvas_context.lineTo(leftX, leftY + this.tileHeight);
            }
            if (tile.top) {
                this.canvas_context.moveTo(leftX, leftY);
                this.canvas_context.lineTo(leftX + this.tileWidth, leftY);
            }
            this.canvas_context.stroke();
        }
        if (tile.right || tile.bottom) {
            this.canvas_context.beginPath();
            const rightX = this.tileWidth * (tile.x + 1) + this.borderOffset;
            const rightY = this.tileHeight * (tile.y + 1) + this.borderOffset;
            if (tile.right) {
                this.canvas_context.moveTo(rightX, rightY);
                this.canvas_context.lineTo(rightX, rightY - this.tileHeight);
            }
            if (tile.bottom) {
                this.canvas_context.moveTo(rightX, rightY);
                this.canvas_context.lineTo(rightX - this.tileWidth, rightY);
            }
            this.canvas_context.stroke();
        }
    }

    animateElement(element, destination) {
        const transforms = [
            {
                left: `${(this.getAbsoluteLeft(element, destination))}px`,
                top: `${(this.getAbsoluteTop(element, destination))}px`
            },
        ];
        element.animate(transforms, animateMoveOptions);
    }

    handleMoveAnimations(moveInfo) {
        if (moveInfo.valid) {
            if (moveInfo.theseus.to) {
                this.animateElement(this.theseus, moveInfo.theseus.to);
            }
            moveInfo.minotaur.forEach(move => {
                this.animateElement(this.minotaur, move.to);
            });
        }
        return moveInfo;
    }
}