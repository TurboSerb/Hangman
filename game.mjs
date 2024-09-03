//#region Dont look behind the curtain
// Do not worry about the next two lines, they just need to be there.
import * as readlinePromises from 'node:readline/promises';
import * as fs from 'node:fs/promises'; // Importing the file system module

const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });

async function askQuestion(question) {
    return await rl.question(question);
}
//#endregion

import { ANSI } from './ansi.mjs';
import { HANGMAN_UI } from './graphics.mjs';

/*
    1. Pick a word from a file
    2. Draw one "line" per char in the picked word.
    3. Ask player to guess one char || the word (knowledge: || is logical or)
    4. Check the guess.
    5. If guess was incorrect; continue drawing
    6. Update char display (used chars and correct)
    7. Is the game over (drawing complete or word guessed)
    8. if not game over start at 3.
    9. Game over, pick a new word and restart.
*/
const stats = {
gamesPlayed: 0,
gamesWon: 0,
totalWrongGuesses: 0,
totalCorrectGuesses: 0,
};

// Function to pick a random word from words.txt
async function randomWord() {
    try {
        const data = await fs.readFile('words.txt', 'utf-8');
        const words = data.split('\n').map(word => word.trim()).filter(word => word.length > 0); // Read file and clean data
        const randomWord = words[Math.floor(Math.random() * words.length)].toLowerCase(); // Pick a random word
        return randomWord;
    } catch (err) {
        console.error('Error reading words.txt file:', err);
        process.exit(1);
    }
}

function drawWordDisplay(correctWord, guessedWord) {
    let wordDisplay = "";
    for (let i = 0; i < correctWord.length; i++) {
        if (guessedWord[i] != "_") {
            wordDisplay += ANSI.COLOR.GREEN;
        }
        wordDisplay = wordDisplay + guessedWord[i] + " ";
        wordDisplay += ANSI.RESET;
    }
    return wordDisplay;
}

function drawList(list, color) {
    let output = color;
    for (let i = 0; i < list.length; i++) {
        output += list[i] + " ";
    }
    return output + ANSI.RESET;
}

function ifPlayerGuessedLetter(answer) {
    return answer.length === 1;
}

async function playGame() {
    stats.gamesPlayed++;
    let correctWord = await randomWord();
    let guessedWord = "".padStart(correctWord.length, "_");
    let isGameOver = false;
    let wasGuessCorrect = false;
    let wrongGuesses = [];
    let allGuesses = new Set();  // Set to keep track of all guessed letters

    // Continue playing until the game is over.
    while (!isGameOver) {
        console.log(ANSI.CLEAR_SCREEN);
        console.log(drawWordDisplay(correctWord, guessedWord));
        console.log(drawList(wrongGuesses, ANSI.COLOR.RED));
        console.log(HANGMAN_UI[wrongGuesses.length]);

        let answer = (await askQuestion("Guess a char or the word: ")).toLowerCase();

        // Check if the guess was already made
        if (ifPlayerGuessedLetter(answer) && allGuesses.has(answer)) {
            console.log(ANSI.COLOR.RED + "Try a different letter." + ANSI.RESET);
            continue; // Skip the rest of the loop and prompt the user again
        }

        allGuesses.add(answer);  // Add the guess to the set of guessed letters

        if (answer === correctWord) {
            isGameOver = true;
            wasGuessCorrect = true;
        } else if (ifPlayerGuessedLetter(answer)) {
            let org = guessedWord;
            guessedWord = "";

            let isCorrect = false;
            for (let i = 0; i < correctWord.length; i++) {
                if (correctWord[i] === answer) {
                    guessedWord += answer;
                    isCorrect = true;
                    stats.totalCorrectGuesses++;
                } else {
                    guessedWord += org[i];
                }
            }

            if (!isCorrect) {
                wrongGuesses.push(answer);
                stats.totalWrongGuesses++;
            } else if (guessedWord === correctWord) {
                isGameOver = true;
                wasGuessCorrect = true;
            }
        }

        // Check if player has made too many wrong guesses
        if (wrongGuesses.length === HANGMAN_UI.length) {
            isGameOver = true;
        }
    }

    // OUR GAME HAS ENDED.
    console.log(ANSI.CLEAR_SCREEN);
    console.log(drawWordDisplay(correctWord, guessedWord));
    console.log(drawList(wrongGuesses, ANSI.COLOR.RED));

    if (wasGuessCorrect) {
        console.log(ANSI.COLOR.YELLOW + "Congratulations, winner winner chicken dinner");
        stats.gamesWon++;
    }

    console.log("Game Over");
  
    const playAgain = (await askQuestion("Would you like to play again? (yes/no): ")).toLowerCase();
    if (playAgain === 'yes') {
        await playGame();
    } else {
        displayStats();
        process.exit();
    }
}

function displayStats() {

console.log("Game stats:")
console.log("")
console.log("Played rounds: " + stats.gamesPlayed);
console.log("Rounds won: " + stats.gamesWon);
console.log("Right Guesses: " + stats.totalCorrectGuesses);
console.log("Wrong Guesses: " + stats.totalWrongGuesses);
console.log("")
}

// Start the game
await playGame();