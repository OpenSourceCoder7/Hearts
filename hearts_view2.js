
import { HeartsRobotKmp } from "./hearts_robot_kmp.js";

//Zhehao Wang helped with rendering logic 

export class HeartsView {
  #model;
  #controller;
  #player;
  #robot1;
  #robot2;
  #robot3;

  constructor(model, controller) {
    this.#model = model;
    this.#controller = controller;
    this.playerName = "You";
    this.render(document.querySelector("#main"));
    this.#model.addEventListener("stateupdate", () => {
      this.render(document.querySelector("#main"));
    });
    this.#model.addEventListener("trickstart", () => {
      this.render(document.querySelector("#main"));
    });
    this.#model.addEventListener("trickplay", () => {
      this.render(document.querySelector("#main"));
    });
    this.#model.addEventListener("scoreupdate", (event) => {
      console.log('score update has fired.')
      const { entry, moonshooter } = event.detail;
      if (
        moonshooter === "west" ||
        moonshooter === "east" ||
        moonshooter === "south" ||
        moonshooter === "north"
      ) {
        window.alert(
          `${this.#model.getPlayerName(moonshooter)} has shot the moon!`
        );
      }
      //render main
      this.render(document.querySelector("#main"));
    });
  }

  render(render_div) {
    let state = this.#model.getState();

    if (state === "uninitialized") {
      this.renderInitialState(render_div);
    }

    if (state === "passing") {
      this.renderPassingState(render_div);
    }

    if (state === "playing") {
      this.renderPlayingState(render_div);
    }

    if (state === "complete") {
      this.renderCompleteState(render_div);
    }
  }

  renderInitialState(render_div) {

    render_div.innerHTML = `<div>
            <input id="playerName" placeholder="Enter your name"></input>
            <button id="startGame">Deal and Start Game</button>
        </div>`;

    let startGame = render_div.querySelector("#startGame");

    startGame.addEventListener("click", () => {
      this.#robot1 = new HeartsRobotKmp(this.#model, this.#controller, "west");
      this.#robot2 = new HeartsRobotKmp(this.#model, this.#controller, "north");
      this.#robot3 = new HeartsRobotKmp(this.#model, this.#controller, "east");
      this.playerName = document.querySelector("#playerName").value;
      this.#controller.startGame("North", "East", this.playerName, "West");
      //back to "main state menu" 
      this.render(render_div); 
    });
  }

  renderPassingState(render_div) {
    this.renderScoreboard(render_div);
    let passingDirection = this.#model.getPassing();
    let hand = this.#model.getHand("south");
    let cards = hand.getCards();


    let cardSelectionHTML = cards
      .map((card, index) => {
        return `<div class="card" data-card-index="${index}">${card.getRankName()} of ${card.getSuit()}</div>`;
      }).join("");

    render_div.innerHTML = `
            <div id="passingDirection">Passing cards ${passingDirection}</div><br>
            <div id="playerHand" class="hand">${cardSelectionHTML}</div>
            <div id="passCardsMessage" class="message"></div>
            <button id="passCardsButton">Pass Selected Cards</button>
            `;
    //Cards logic
    let selectedCards = [];
    document.querySelectorAll("#playerHand .card").forEach((cardElement) => {
      cardElement.addEventListener("click", () => {
        let cardIndex = cardElement.getAttribute("data-card-index");
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
    });

    document.getElementById("passCardsButton").addEventListener("click", () => {
      if (selectedCards.length === 3) {
        let cardsToPass = selectedCards.map((index) => cards[index]);
        this.#controller.passCards("south", cardsToPass);
      } else {
        document.querySelector("#passCardsMessage").innerHTML =
          "<p><b>Please select exactly 3 cards.</b></p>";
      }
    });
  }

  renderPlayingState(render_div) {
    

      //proper rendering?

      try {
        this.renderScoreboard(render_div);
      
        this.renderCurrentRoundScoreboard(render_div);

      } catch(error){
        console.error('error with rendering', error);
      }

        

        
        
    


    const hand = this.#model.getHand("south");
    const cards = hand.getCards();
    const currentTrick = this.#model.getCurrentTrick();

    //html of the cards altogether
    let cardSelectionHTML = cards
      .map((card, index) => {
        return `<div class="card" data-card-index="${index}">${card.getRankName()} of ${card.getSuit()}</div>`;
      })
      .join("");

      
    //within the <div> here, we have all of the cards conglomerated in one div for player's hand
    render_div.innerHTML = `
            <div id="playerHand" class="hand">${cardSelectionHTML}</div>
            <button id="cardPlayButton">Play Cards</button>
            `;

    //trick logic
    let trickHTML = '<div id="currentTrick" class="trick">';
    if (currentTrick) {
      let trickCardID = 0;
      ["north", "east", "west", "south"].forEach((position) => {
        let card = currentTrick.getCard(position);
        trickHTML += `<div ="trick-card" id="card${trickCardID++}">${
          card
            ? `${card.getRankName()} of ${card.getSuit()}`
            : `${this.#model.getPlayerName(position)} has not gone yet`
        }</div>`;
      });
    }
    trickHTML += "</div><br>";
    render_div.innerHTML = `            
        <div id="currentTrick">${trickHTML}</div>
        <div id="playerHand" class="hand">${cardSelectionHTML}</div>
        <button id="cardPlayButton">Play Selected Card</button>
        `;

    let selectedCards = [];
    document.querySelectorAll("#playerHand .card").forEach((cardElement) => {
      cardElement.addEventListener("click", () => {
        let cardIndex = cardElement.getAttribute("data-card-index");
        let selectedCard = cards[cardIndex];
        if (selectedCards.includes(cardIndex)) {
          selectedCards = selectedCards.filter((index) => index !== cardIndex);
          cardElement.classList.remove("selected");
          cardElement.style.fontWeight = "normal";
        } else {
          if (
            selectedCards.length < 1 &&
            this.#controller.isPlayable("south", selectedCard)
          ) {
            selectedCards.forEach((idx) => {
              document
                .querySelector(`#playerHand .card[data-card-index="${idx}"]`)
                .classList.remove("selected");
              document.querySelector(
                `#playerHand .card[data-card-index="${idx}"]`
              ).style.fontWeight = "normal";
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
          `<div>
                    <p><b>Please select exactly 1 card</b></p>
                    </div>`
        );
      }
      if (selectedCards.length === 1) {
        let cardsToPlay = selectedCards.map((index) => cards[index]);
        this.#controller.playCard("south", cardsToPlay[0]);
      }
    });
    //is this even necessary????
  }

  renderScoreboard(render_div) {
    let scores = {
      North: this.#model.getScore("north"),
      East: this.#model.getScore("east"),
      [this.playerName]: this.#model.getScore("south"),
      West: this.#model.getScore("west"),
    };

    let scoreDetails = Object.entries(scores)
      .map(([name, score]) => {
        return `${name}: ${score} points`;
      })
      .join("<br>");

    let scoreboardDiv = document.createElement('div');
    scoreboardDiv.setAttribute('id', 'scoreboard');
    scoreboardDiv.innerHTML = `
            <div>
            <h3>Total Game Scores:</h3>
            <p>${scoreDetails}</p>
            </div>`;
    
    render_div.appendChild(scoreboardDiv);
    //still not loading to dom properly...
  }

  renderCurrentRoundScoreboard(render_div) {
    let scores = {
      North: this.#model.getCurrentGamePoints("north"),
      East: this.#model.getCurrentGamePoints("east"),
      [this.playerName]: this.#model.getCurrentGamePoints("south"),
      West: this.#model.getCurrentGamePoints("west"),
    };
    let scoreDetails2 = Object.entries(scores)
      .map(([name, score]) => {
        return `${name}: ${score} points`;
      })
      .join("<br>");
      
    let roundScoreBoard = document.getElementById('scoreboard');
    roundScoreBoard.insertAdjacentHTML(
      "beforeend",
      `<div>
            <h3>Current Round Scores:</h3>
            <p>${scoreDetails2}</p>
            </div>`
    );
    //might need to remove if bugs...
    render_div.appendChild(roundScoreBoard);

  }

  renderCompleteState(render_div) {
    //audio from https://www.videvo.net/sound-effect/mi-explosion-03-hpx/251585/#rs=audio-download
    console.log('rendercomplete ran');
    let boom = new Audio("explosion.mp3");
    boom.volume = 1
    boom.loop = true;
    boom.play();
    let scores = {
      jesse: this.#model.getScore("north"),
      jane: this.#model.getScore("east"),
      [this.playerName]: this.#model.getScore("south"),
      walter: this.#model.getScore("west"),
    };

    let winner = Object.keys(scores).reduce((a, b) =>
      scores[a] < scores[b] ? a : b
    );
    let scoreDetails = Object.entries(scores)
      .map(([position, score]) => {
        return `${position.toUpperCase()}: ${score} points`;
      })
      .join("<br>");

    render_div.innerHTML = `<div>
            <h2>Game Over!</h2>
            <p>The winner is ${winner.toUpperCase()} with ${
      scores[winner]
    } points.</p>
            <h3>Final Scores:</h3>
            <p>${scoreDetails}</p>
        </div>`;
  }
}