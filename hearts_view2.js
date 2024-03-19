import { HeartsRobotKmp } from "./hearts_robot_kmp.js";

//Zhehao Wang helped me achieve a modular rendering style (he did not help me "significantly" though)
//audio file is from https://www.videvo.net
//asked classmates questions on how they approached initializing card buttons.
//in process of understanding event listener logic
export class HeartsView {
  model;
  controller;
  playerName
  #dolater(fn) { setTimeout(fn,1000)};
  constructor(model, controller) {
    this.model = model;
    this.controller = controller;
    this.playerName = "Saman";
    this.render(document.querySelector("#main"));
    this.model.addEventListener("stateupdate", () => this.#dolater(() => {
      this.render(document.querySelector("#main"));

    }))
    this.model.addEventListener("trickstart", () => this.#dolater(() => {
      this.render(document.querySelector("#main"));

    }))
    this.model.addEventListener("trickplay", () => this.#dolater(() => {
      this.render(document.querySelector("#main"));

    }))
    this.model.addEventListener("scoreupdate", () => this.#dolater(() => {
      this.render(document.querySelector("#main"));

    }))
  }

 

  

  render(renderDiv) {
    const state = this.model.getState();
    if (state === "uninitialized") {
      this.renderInitialState(renderDiv);
    } else if (state === "passing") {
      this.renderPassingState(renderDiv);
    } else if (state === "playing") {
      this.renderPlayingState(renderDiv);
    } else if (state === "complete") {
      this.renderCompleteState(renderDiv);
    }
  }

  renderInitialState(renderDiv) {
    renderDiv.innerHTML = `
      <div>
        <input id="playerName" placeholder="Enter your name"></input>
        <button id="startGame">Deal and Start Game</button>
      </div>`;

    const startGameBtn = renderDiv.querySelector("#startGame");
    startGameBtn.addEventListener("click", () => {
      this.startGame(renderDiv);
    });
  }

  startGame(renderDiv) {
    this.setupRobots();
    this.playerName = document.querySelector("#playerName").value;
    this.controller.startGame("North", "East", this.playerName, "West");
    this.render(renderDiv);
  }

  setupRobots() {
    this.robot1 = new HeartsRobotKmp(this.model, this.controller, "west");
    this.robot2 = new HeartsRobotKmp(this.model, this.controller, "north");
    this.robot3 = new HeartsRobotKmp(this.model, this.controller, "east");
  }

  renderPassingState(renderDiv) {
    
    // Render passing state UI
    const passingDirection = this.model.getPassing();
    const hand = this.model.getHand("south");
    const cards = hand.getCards();
  
    const cardSelectionHTML = cards.map((card, index) => {
      return `<div class="card" data-card-index="${index}">${card.getRankName()} of ${card.getSuit()}</div>`;
    }).join("");
  
    renderDiv.innerHTML = `
      <div id="passingDirection">Passing cards ${passingDirection}</div><br>
      <div id="playerHand" class="hand">${cardSelectionHTML}</div>
      <div id="passCardsMessage" class="message"></div>
      <button id="passCardsButton">Pass Selected Cards</button>
    `;
  
    let selectedCards = [];
    document.querySelectorAll("#playerHand .card").forEach((cardElement) => {
      cardElement.addEventListener("click", () => {
        const cardIndex = cardElement.getAttribute("data-card-index");
        if (selectedCards.includes(cardIndex)) {
          selectedCards = selectedCards.filter((index) => index !== cardIndex);
          cardElement.classList.remove("selected");
          cardElement.style.fontWeight = "normal";
        } else {
          if (selectedCards.length < 3) {
            selectedCards.push(cardIndex);
            cardElement.classList.add("selected");
            cardElement.style.fontWeight = "bold";
          } else {
            document.querySelector("#passCardsMessage").innerHTML =
              "<p><b>Please select exactly 3 cards, click a card again to deselect</b></p>";
          }
        }
      });
    })


    document.getElementById("passCardsButton").addEventListener("click", () => {
      if (selectedCards.length === 3) {
        const cardsToPass = selectedCards.map((index) => cards[index]);
        this.controller.passCards("south", cardsToPass);
      } else {
        document.querySelector("#passCardsMessage").innerHTML =
          "<p><b>Please select exactly 3 cards.</b></p>";
      }
    });
  

  }

  renderPlayingState(renderDiv) {
    const hand = this.model.getHand("south");
    const cards = hand.getCards();
    const currentTrick = this.model.getCurrentTrick();
  
    let cardSelectionHTML = cards.map((card, index) => {
      return `<div class="card" data-card-index="${index}">${card.getRankName()} of ${card.getSuit()}</div>`;
    }).join("");
  
    renderDiv.innerHTML = `
      <div id="playerHand" class="hand">${cardSelectionHTML}</div>
      <button id="cardPlayButton">Play Selected Card</button>
    `;
  
    let trickHTML = '<div id="currentTrick" class="trick">';
    if (currentTrick) {
      let trickCardID = 0;
      ["north", "east", "west", "south"].forEach((position) => {
        const card = currentTrick.getCard(position);
        trickHTML += `<div ="trick-card" id="card${trickCardID++}">${
          card ? `${card.getRankName()} of ${card.getSuit()}` : `${this.model.getPlayerName(position)} has not gone yet`
        }</div>`;
      });
    }
    trickHTML += "</div><br>";
    renderDiv.insertAdjacentHTML("beforeend", trickHTML);
  
      let selectedCards = [];
    document.querySelectorAll("#playerHand .card").forEach((cardElement) => {
      cardElement.addEventListener("click", () => {
        const cardIndex = cardElement.getAttribute("data-card-index");
        const selectedCard = cards[cardIndex];
        if (selectedCards.includes(cardIndex)) {
          selectedCards = selectedCards.filter((index) => index !== cardIndex);
          cardElement.classList.remove("selected");
          cardElement.style.fontWeight = "normal";
        } else {
          if (selectedCards.length < 1 && this.controller.isPlayable("south", selectedCard)) {
            selectedCards.forEach((idx) => {
              document.querySelector(`#playerHand .card[data-card-index="${idx}"]`).classList.remove("selected");
              document.querySelector(`#playerHand .card[data-card-index="${idx}"]`).style.fontWeight = "normal";
            });
            selectedCards = [cardIndex];
            cardElement.classList.add("selected");
            cardElement.style.fontWeight = "bold";
          }
        }
      });
    });
  
    document.getElementById("cardPlayButton").addEventListener("click", () => {
      if (selectedCards.length === 0) {
        document.querySelector("#playerHand").insertAdjacentHTML(
          "beforeend",
          `<div><p><b>Please select exactly 1 card</b></p></div>`
        );
      }
      if (selectedCards.length === 1) {
        const cardsToPlay = selectedCards.map((index) => cards[index]);
        this.controller.playCard("south", cardsToPlay[0]);
      }
    });
  }
  

  renderCompleteState(renderDiv) {
    const scores = {
      jesse: this.model.getScore("north"),
      jane: this.model.getScore("east"),
      [this.playerName]: this.model.getScore("south"),
      walter: this.model.getScore("west"),
    };
  
    const winner = Object.keys(scores).reduce((a, b) =>
      scores[a] < scores[b] ? a : b
    );
  
    const scoreDetails = Object.entries(scores).map(([position, score]) => {
      return `${position.toUpperCase()}: ${score} points`;
    }).join("<br>");
  
    renderDiv.innerHTML = `
      <div>
        <h2>Game Over!</h2>
        <p>The winner is ${winner.toUpperCase()} with ${scores[winner]} points.</p>
        <h3>Final Scores:</h3>
        <p>${scoreDetails}</p>
      </div>`;
  }

  handleScoreUpdate(event) {
    const { entry, moonshooter } = event.detail;
    if (moonshooter && ["west", "east", "south", "north"].includes(moonshooter)) {
      window.alert(`${this.model.getPlayerName(moonshooter)} has shot the moon!`);
    }
  }

  renderScores(renderDiv) {
    const scores = {
      North: this.model.getScore("north"),
      East: this.model.getScore("east"),
      [this.playerName]: this.model.getScore("south"),
      West: this.model.getScore("west"),
    };

    let scoreDetails = "<h3>Current Scores:</h3>";
    Object.entries(scores).forEach(([name, score]) => {
      scoreDetails += `<p>${name}: ${score} points</p>`;
    });

    // Update the scores section of the UI
    const scoresDiv = renderDiv.querySelector("#scores");
    if (scoresDiv) {
      scoresDiv.innerHTML = scoreDetails;
    } else {
      renderDiv.insertAdjacentHTML("beforeend", `<div id="scores">${scoreDetails}</div>`);
    }
    this.render(renderDiv);
  }
  
}

  



