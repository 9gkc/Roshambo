let resultDiv = document.getElementById("result");
let playerChoice = document.getElementById("player-choice");
let computerChoice = document.getElementById("computer-choice");

const choices = ["rock", "paper", "scissors"];
const images = {
  rock: "images/rock.png",
  paper: "images/paper.png",
  scissors: "images/scissors.png",
};

function playGame(playerSelection) {
  // Update Player Image
  playerChoice.src = images[playerSelection];

  // Disable Buttons
  toggleButtons(false);

  // Shuffle Computer Choice
  let shuffleInterval = setInterval(() => {
    let randomChoice = choices[Math.floor(Math.random() * choices.length)];
    // console.log(randomChoice);
    computerChoice.src = images[randomChoice];
    // console.log(randomChoice);
  }, 50);

  setTimeout(() => {
    // Stop Shuffling
    clearInterval(shuffleInterval);

    // Get Random Image
    let computerSelection = choices[Math.floor(Math.random() * choices.length)];
    computerChoice.src = images[computerSelection];

    let result = getResult(playerSelection, computerSelection);
    resultDiv.innerHTML = result;

    saveResult(playerSelection, computerSelection, result);
    displayHistoryMatches();
  }, 2000);

  setTimeout(() => {
    playerChoice.src = "images/choose.png";
    computerChoice.src = "images/random.png";
    resultDiv.innerHTML = "";
    // Re-Enable Buttons
    toggleButtons(true);
  }, 4000);
}

function getResult(player, computer) {
  if (player === computer) return `Draw`;
  if (
    (player === "rock" && computer === "scissors") ||
    (player === "paper" && computer === "rock") ||
    (player === "scissors" && computer === "paper")
  ) {
    return `Win`;
  } else {
    return `Lose`;
  }
}

function saveResult(player, computer, result) {
  let matchHistory = JSON.parse(localStorage.getItem("matches")) || [];

  // Add Match
  matchHistory.push({ player, computer, result });

  if (matchHistory.length > 10) {
    matchHistory.shift(); // Remove The Oldest Match
  }

  // Save To Local Storage
  localStorage.setItem("matches", JSON.stringify(matchHistory));
}

function displayHistoryMatches() {
  let matchHistory = JSON.parse(localStorage.getItem("matches")) || [];
  // console.log(matchHistory);
  let historyContainer = document.getElementById("match-history");
  let resetContainer = document.getElementById("reset-container");

  if (matchHistory.length === 0) return;

  // Count Win and Lose and Draw
  let winCount = matchHistory.filter((match) => match.result === "Win").length;
  let loseCount = matchHistory.filter((match) => match.result === "Lose").length;
  let drawCount = matchHistory.filter((match) => match.result === "Draw").length;

  // console.log(winCount);
  // console.log(loseCount);
  // console.log(drawCount);

  let tableHTML = `
  <table>
    <caption>Match History</caption>
    <thead>
      <tr>
        <th>#</th>
        <th>Your Choice</th>
        <th>Computer's Choice</th>
        <th>Result</th>
      </tr>
    </thead>
    <tbody>
  `;
  matchHistory.forEach((match, index) => {
    tableHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${match.player}</td>
        <td>${match.computer}</td>
        <td>${match.result}</td>
      </tr>
    `;
  });
  tableHTML += `
    </tbody>
  </table>
  `;

  historyContainer.innerHTML = tableHTML;
  historyContainer.innerHTML += `
    <div class="stats">
      <div>Wins <span>${winCount}</span></div>
      <div>Lose <span>${loseCount}</span></div>
      <div>Draw <span>${drawCount}</span></div>
    </div>
  `;

  resetContainer.innerHTML = `<button id="reset-btn" class="reset-btn">Reset Score</button>`;

  // Reset Button
  document.getElementById("reset-btn").addEventListener("click", function () {
    localStorage.removeItem("matches");
    // historyContainer.innerHTML = "";
    location.reload();
  });
}

function toggleButtons(state) {
  document.querySelectorAll(".buttons button").forEach((button) => {
    button.disabled = !state;
    button.style.opacity = state ? "1" : "0.7";
  });
}

// Load Matches History
document.addEventListener("DOMContentLoaded", () => {
  displayHistoryMatches();
});
