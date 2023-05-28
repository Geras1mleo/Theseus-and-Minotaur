Array.prototype.getCoordinateOf = function (value) {
    for (let i = 0; i < this.length; i++) {
        for (let j = 0; j < this[i].length; j++) {
            if (this[i][j] === value) {
                return {
                    x: (j - 1) / 2,
                    y: (i - 1) / 2
                };
            }
        }
    }
};

export function getDimensions(tiles) {
    const maxX = Math.max(...(tiles.map(t => t.x)));
    const maxY = Math.max(...(tiles.map(t => t.y)));
    return [maxX + 1, maxY + 1];
}

function getWalls(tiles) {
    const walls = {
        horizontalWalls: new Set(),
        verticalWalls: new Set(),
    };

    for (const tile of tiles) {
        const offsets = [
            {direction: "left", offset: {x: 0, y: 0}, set: walls.verticalWalls},
            {direction: "top", offset: {x: 0, y: 0}, set: walls.horizontalWalls},
            {direction: "right", offset: {x: 1, y: 0}, set: walls.verticalWalls},
            {direction: "bottom", offset: {x: 0, y: 1}, set: walls.horizontalWalls},
        ];
        for (const offset of offsets) {
            if (tile[offset.direction]) {
                offset.set.add({
                    x: tile.x + offset.offset.x,
                    y: tile.y + offset.offset.y,
                });
            }
        }
    }

    return walls;
}

function getDistance(pos1, pos2) {
    return Math.abs(pos1.y - pos2.y) + Math.abs(pos1.x - pos2.x);
}

export class Game {

    moveOffsets = {
        "L": {offset: {x: -1, y: 0}},
        "R": {offset: {x: 1, y: 0}},
        "U": {offset: {x: 0, y: -1}},
        "D": {offset: {x: 0, y: 1}},
    };

    constructor(args) {
        const [colCount, rowCount] = getDimensions(args.tiles);

        const boardRows = rowCount * 2 + 1;
        const boardCols = colCount * 2 + 1;

        this.board = new Array(boardRows).fill(null).map((_, row) =>
            new Array(boardCols).fill(null).map((_, col) =>
                col % 2 === 0 && row % 2 === 0 ? "+" : " "
            )
        );

        this.setWalls(args);

        this.board[args.exit.y * 2 + 1][args.exit.x * 2 + 1] = "E";
        this.board[args.theseus.y * 2 + 1][args.theseus.x * 2 + 1] = "T";
        this.board[args.minotaur.y * 2 + 1][args.minotaur.x * 2 + 1] = "M";
    }

    setWalls(args) {
        const walls = getWalls(args.tiles);
        for (const wall of walls.horizontalWalls) {
            this.board[wall.y * 2][wall.x * 2 + 1] = "-";
        }
        for (const wall of walls.verticalWalls) {
            this.board[wall.y * 2 + 1][wall.x * 2] = "|";
        }
    }

    toString() {
        return this.board.map(row => row.join("")).join("\n");
    }

    isValid(fromCoord, direction) {
        const moveOffset = this.moveOffsets[direction].offset;
        const newCoord = {
            x: fromCoord.x + moveOffset.x,
            y: fromCoord.y + moveOffset.y
        };

        const minotaurCoordinates = this.getMinotaurCoordinates();
        if (newCoord.y < 0 && newCoord.y >= this.board.length ||
            newCoord.x < 0 && newCoord.x >= this.board[0].length ||
            (newCoord.x === minotaurCoordinates.x && newCoord.y === minotaurCoordinates.y)) {
            return false;
        }

        const wall = this.board[fromCoord.y * 2 + 1 + moveOffset.y][fromCoord.x * 2 + 1 + moveOffset.x];
        return wall !== "|" && wall !== "-" && wall !== "M";
    }

    getTheseusCoordinates() {
        return this.board.getCoordinateOf("T");
    }

    getMinotaurCoordinates() {
        return this.board.getCoordinateOf("M");
    }

    getExitCoordinates() {
        return this.board.getCoordinateOf("E");
    }

    hasWon() {
        return !this.hasLost() && this.getExitCoordinates() === undefined;
    }

    hasLost() {
        return this.getTheseusCoordinates() === undefined;
    }

    move(direction) {
        const moveInfo = {
            valid: false,
            theseus: {},
            minotaur: [],
        };

        if (this.hasLost() || this.hasWon() ||
            (direction !== "P" && !this.isValid(this.getTheseusCoordinates(), direction))) {
            return moveInfo;
        }

        if (direction !== "P") {
            this.moveTheseus(direction);
            moveInfo.theseus.to = this.getTheseusCoordinates();
        }

        moveInfo.valid = true;
        // Minotaur moves 2 times
        for (let i = 0; i < 2; i++) {
            if (!this.hasLost() && !this.hasWon()) {
                const from = this.getMinotaurCoordinates();
                this.moveMinotaurus();
                const to = this.getMinotaurCoordinates();

                if (from.x !== to.x || from.y !== to.y) {
                    moveInfo.minotaur.push({
                        to: to
                    });
                }
            }
        }

        return moveInfo;
    }

    moveObject(fromPos, direction, movingObject) {
        const moveOffset = this.moveOffsets[direction].offset;
        const newCoordinates = {
            x: fromPos.x + moveOffset.x,
            y: fromPos.y + moveOffset.y
        };

        this.board[fromPos.y * 2 + 1][fromPos.x * 2 + 1] = " ";
        this.board[newCoordinates.y * 2 + 1][newCoordinates.x * 2 + 1] = movingObject;
    }

    moveTheseus(direction) {
        this.moveObject(this.getTheseusCoordinates(), direction, "T");
    }

    moveMinotaurus() {
        const theseus = this.getTheseusCoordinates();
        const minotaur = this.getMinotaurCoordinates();
        const currentDistance = getDistance(theseus, minotaur);

        const distances = {
            L: {distance: Infinity},
            R: {distance: Infinity},
            U: {distance: Infinity},
            D: {distance: Infinity},
        };

        for (const direction of ["L", "R", "U", "D"]) {
            if (this.isValid(minotaur, direction)) {
                const moveOffset = this.moveOffsets[direction].offset;
                distances[direction].distance = getDistance({
                    x: minotaur.x + moveOffset.x,
                    y: minotaur.y + moveOffset.y,
                }, theseus);
            }
        }

        let direction = null;
        if (distances.L.distance < currentDistance || distances.R.distance < currentDistance) {
            if (distances.L.distance < distances.R.distance) {
                direction = "L";
            } else {
                direction = "R";
            }
            this.moveObject(minotaur, direction, "M");
        } else if (distances.U.distance < currentDistance || distances.D.distance < currentDistance) {
            if (distances.U.distance < distances.D.distance) {
                direction = "U";
            } else {
                direction = "D";
            }
            this.moveObject(minotaur, direction, "M");
        }
    }
}
