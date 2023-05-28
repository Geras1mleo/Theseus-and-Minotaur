import {Game} from './game.js';
import {GameView} from './gameView.js';

const serverIP = "http://localhost:5000";

let game;
let gameView;
let currentLevel = 1;
let currentScore = 1;

const levelLabel = document.getElementById("levelLabel");
const highscoreLabel = document.getElementById("highscoreLabel");
const scoreLabel = document.getElementById("scoreLabel");
const randomLabel = document.getElementById("randomLabel");
const errorLabel = document.getElementById("errorLabel");
const gameBox = document.getElementById("gameBox");

const levelsCount = await getLevelsCount();

function mod(n, m) {
    return ((n % m) + m) % m;
}

const moveKeyMap = {
    arrowleft: "L",
    arrowright: "R",
    arrowup: "U",
    arrowdown: "D",
    " ": "P",
};

const animateHighlightOptions = {
    duration: 150,
    easing: "ease-in-out",
    direction: "alternate",
    iterations: 2,
    delay: 0,
};

const elementsMap = {};

function setControlsHandlers() {
    const movingHandler = async direction => {
        const directionLetter = moveKeyMap[direction];
        const moveInfo = gameView.handleMoveAnimations(game.move(directionLetter));
        if (moveInfo.valid) {
            currentScore += 1;
            scoreLabel.textContent = currentScore;
            if (game.hasWon()) {
                const response = await fetch(serverIP + "/highscore/" + currentLevel, {
                    method: "POST",
                    body: JSON.stringify({
                        highscore: currentScore
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
                if (response.status === 200) {
                    highscoreLabel.textContent = currentScore;
                }
            }
        }
    };

    elementsMap.arrowleft = {
        element: document.getElementById("leftArrow"),
        handler: movingHandler
    };
    elementsMap.arrowright = {
        element: document.getElementById("rightArrow"),
        handler: movingHandler
    };
    elementsMap.arrowup = {
        element: document.getElementById("upArrow"),
        handler: movingHandler
    };
    elementsMap.arrowdown = {
        element: document.getElementById("downArrow"),
        handler: movingHandler
    };
    elementsMap[" "] = {
        element: document.getElementById("spaceKey"),
        handler: movingHandler
    };
    elementsMap.r = {
        element: document.getElementById("resetKey"),
        handler: async () => await startLevel(currentLevel)
    };
    elementsMap.n = {
        element: document.getElementById("nextKey"),
        handler: async () => await startLevel(currentLevel + 1)
    };
    elementsMap.p = {
        element: document.getElementById("previousKey"),
        handler: async () => await startLevel(currentLevel - 1)
    };

    for (const key in elementsMap) {
        elementsMap[key].element.onclick = () => {
            let param;
            if (key in moveKeyMap) {
                param = key;
            }
            highlightElement(elementsMap[key].element);
            elementsMap[key].handler(param);
        };
    }
    document.onkeydown = handleDocumentKeyDown;
    randomLabel.onclick = () => startLevel();
}

async function getLevelsCount() {
    try {
        const response = await fetch(serverIP + "/levels");
        return (await response.json()).aantal_levels;
    } catch (error) {
        errorLabel.style.visibility = "visible";
        return 0;
    }
}

async function startLevel(level) {
    try {
        let args;
        if (level === undefined) { // if random
            const response = await fetch(serverIP + "/random_level");
            args = await response.json();
        } else {
            currentLevel = mod(level - 1, levelsCount) + 1 || 0; // NaN => 0
            const response = await fetch(serverIP + "/level/" + currentLevel);
            args = await response.json();
        }

        currentLevel = args.level;
        currentScore = 0;
        levelLabel.textContent = currentLevel;
        scoreLabel.textContent = currentScore;
        highscoreLabel.textContent = args.highscore;

        game = new Game(args.game);
        gameView = new GameView(args.game, "gameBox", "canvas", "theseus", "minotaur", "exitLabel");
        errorLabel.style.visibility = "hidden";
    } catch (error) {
        errorLabel.style.visibility = "visible";
        gameBox.style.visibility = "hidden";
    }
}

function handleDocumentKeyDown(ev) {
    let direction = ev.key.toLowerCase();
    if (direction in elementsMap) {
        elementsMap[direction].handler(direction);
        highlightElement(elementsMap[direction].element);
    }
}

function highlightElement(element) {
    const transforms = [
        {boxShadow: "0 0 10px 5px #71D4FE"}
    ];
    element.animate(transforms, animateHighlightOptions);
}

async function start() {
    setControlsHandlers();
    await startLevel(currentLevel);
}

await start();