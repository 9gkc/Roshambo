const playerChoiceImage = document.querySelector("#player-choice");
const computerChoiceImage = document.querySelector("#computer-choice");
const resultElement = document.querySelector("#result");
const gameStatus = document.querySelector("#game-status");
const historyContainer = document.querySelector("#match-history");
const resetContainer = document.querySelector("#reset-container");
const choiceButtons = document.querySelectorAll("[data-choice]");

const choices = ["rock", "paper", "scissors"];
const images = {
  rock: "images/rock.png",
  paper: "images/paper.png",
  scissors: "images/scissors.png",
};
const defaultImages = {
  player: "images/choose.png",
  computer: "images/random.png",
};
const storageKey = "roshambo.matches.v1";
const maxHistory = 10;
let shuffleTimer = null;
let finishTimer = null;
let resetTimer = null;
let roundInProgress = false;

function setStatus(message, tone = "info") {
  if (!gameStatus) return;
  gameStatus.textContent = message;
  gameStatus.dataset.tone = tone;
}

function randomIndex(length) {
  const cryptoSource = globalThis.crypto;
  if (!cryptoSource?.getRandomValues) return Math.floor(Math.random() * length);
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / length) * length;
  do {
    cryptoSource.getRandomValues(values);
  } while (values[0] >= limit);
  return values[0] % length;
}

function readMatches() {
  try {
    const saved = localStorage.getItem(storageKey) ?? localStorage.getItem("matches") ?? "[]";
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((match) => (
      match &&
      choices.includes(match.player) &&
      choices.includes(match.computer) &&
      ["Win", "Lose", "Draw"].includes(match.result)
    )).slice(-maxHistory);
  } catch (error) {
    console.error("Unable to read match history", error);
    setStatus("Match history could not be read from this browser.", "error");
    return [];
  }
}

function saveMatches(matches) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(matches.slice(-maxHistory)));
    return true;
  } catch (error) {
    console.error("Unable to save match history", error);
    setStatus("The result was calculated, but history could not be saved.", "error");
    return false;
  }
}

function getResult(player, computer) {
  if (player === computer) return "Draw";
  const playerWins = (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  );
  return playerWins ? "Win" : "Lose";
}

function toggleButtons(enabled) {
  choiceButtons.forEach((button) => {
    button.disabled = !enabled;
    button.setAttribute("aria-disabled", String(!enabled));
  });
}

function clearRoundTimers() {
  if (shuffleTimer) window.clearInterval(shuffleTimer);
  if (finishTimer) window.clearTimeout(finishTimer);
  if (resetTimer) window.clearTimeout(resetTimer);
  shuffleTimer = null;
  finishTimer = null;
  resetTimer = null;
}

function updateChoiceImage(image, choice, isPlayer) {
  if (!image) return;
  image.src = images[choice];
  image.alt = `${isPlayer ? "Your" : "Computer's"} choice: ${choice}`;
}

function resetRound() {
  playerChoiceImage?.setAttribute("src", defaultImages.player);
  playerChoiceImage?.setAttribute("alt", "Your choice");
  computerChoiceImage?.setAttribute("src", defaultImages.computer);
  computerChoiceImage?.setAttribute("alt", "Computer choice");
  if (resultElement) resultElement.textContent = "Choose rock, paper, or scissors.";
  roundInProgress = false;
  toggleButtons(true);
}

function appendCell(row, text, header = false) {
  const cell = document.createElement(header ? "th" : "td");
  cell.textContent = text;
  row.appendChild(cell);
}

function displayHistoryMatches() {
  if (!historyContainer || !resetContainer) return;
  const matches = readMatches();
  historyContainer.replaceChildren();
  resetContainer.replaceChildren();

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "No matches played yet.";
    historyContainer.appendChild(empty);
    return;
  }

  const wins = matches.filter((match) => match.result === "Win").length;
  const losses = matches.filter((match) => match.result === "Lose").length;
  const draws = matches.filter((match) => match.result === "Draw").length;
  const table = document.createElement("table");
  const caption = document.createElement("caption");
  caption.textContent = "Match history";
  table.appendChild(caption);
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["#", "Your choice", "Computer's choice", "Result"].forEach((label) => appendCell(headRow, label, true));
  head.appendChild(headRow);
  table.appendChild(head);
  const body = document.createElement("tbody");
  matches.forEach((match, index) => {
    const row = document.createElement("tr");
    appendCell(row, String(index + 1));
    appendCell(row, match.player);
    appendCell(row, match.computer);
    appendCell(row, match.result);
    body.appendChild(row);
  });
  table.appendChild(body);
  historyContainer.appendChild(table);

  const stats = document.createElement("div");
  stats.className = "stats";
  [["Wins", wins], ["Losses", losses], ["Draws", draws]].forEach(([label, count]) => {
    const stat = document.createElement("div");
    const labelElement = document.createElement("span");
    labelElement.textContent = label;
    const countElement = document.createElement("strong");
    countElement.textContent = String(count);
    stat.append(labelElement, countElement);
    stats.appendChild(stat);
  });
  historyContainer.appendChild(stats);

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "reset-btn";
  resetButton.textContent = "Reset score";
  resetButton.addEventListener("click", () => {
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem("matches");
      displayHistoryMatches();
      setStatus("Match history reset.", "success");
    } catch (error) {
      setStatus("Match history could not be reset.", "error");
      console.error("Unable to reset match history", error);
    }
  });
  resetContainer.appendChild(resetButton);
}

function finishRound(playerSelection) {
  shuffleTimer = null;
  const computerSelection = choices[randomIndex(choices.length)];
  updateChoiceImage(computerChoiceImage, computerSelection, false);
  const result = getResult(playerSelection, computerSelection);
  if (resultElement) resultElement.textContent = result;
  const matches = readMatches();
  matches.push({ player: playerSelection, computer: computerSelection, result });
  saveMatches(matches);
  displayHistoryMatches();
  setStatus(`${result}. Choose again when ready.`, result === "Win" ? "success" : "info");
  finishTimer = window.setTimeout(() => {
    resetRound();
    finishTimer = null;
  }, 2_500);
}

function playGame(playerSelection) {
  if (!choices.includes(playerSelection) || roundInProgress) return;
  clearRoundTimers();
  roundInProgress = true;
  toggleButtons(false);
  updateChoiceImage(playerChoiceImage, playerSelection, true);
  if (resultElement) resultElement.textContent = "Computer is choosing…";
  setStatus("Round in progress…");
  shuffleTimer = window.setInterval(() => {
    updateChoiceImage(computerChoiceImage, choices[randomIndex(choices.length)], false);
  }, 75);
  finishTimer = window.setTimeout(() => finishRound(playerSelection), 1_200);
}

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => playGame(button.dataset.choice));
});

window.addEventListener("beforeunload", clearRoundTimers);
displayHistoryMatches();
