import {HeartsRobotKmp} from "./hearts_robot_kmp.js";
import {Card, Hand, Trick} from "./hearts_model.js";
import {HU} from "./hearts_utils.js";

export class HeartsCLIView {
    #model
    #controller

    constructor(model, controller) {
        this.#model = model;
        this.#controller = controller;
    }

    render(render_div) {
        let out_ta = document.createElement('textarea');
        out_ta.style.width = '800px';
        out_ta.style.height = '800px';
        out_ta.readOnly = true;

        let cli = document.createElement('input');
        cli.style.width = '800px';

        cli.setAttribute('type', 'text');

        render_div.append(out_ta);
        render_div.append(document.createElement('br'));
        render_div.append(cli);

        cli.addEventListener('change', () => {
            let [component, method, ...args] = cli.value.split(" ");

            out_ta.append(`> ${cli.value}\n`);

            let res = null;
            if (component == 'model') {
                let res = this.#model[method](...args);
                if ((res instanceof Hand) || (res instanceof Trick)) {
                    out_ta.append(`${res.toString()}\n`);
                } else {
                    out_ta.append(`${JSON.stringify(res)}\n`);
                }
            } else if (component == 'controller') {
                switch (method) {
                    case 'passCards':
                        res = this.#controller.passCards('south',
                                                             [this.#parseCard(args[0]),
                                                              this.#parseCard(args[1]),
                                                              this.#parseCard(args[2])]);
                        break;
                    case 'isPlayable':
                        res = this.#controller.isPlayable('south', this.#parseCard(args[0]));
                        break;
                    case 'playCard':
                        res = this.#controller.playCard('south', this.#parseCard(args[0]));
                        break;
                }
                out_ta.append(`${res}\n`);
            }
            cli.value = "";
        });

        this.#model.addEventListener('stateupdate', () => {
            if (this.#model.getState() == 'passing') {
                out_ta.append("Passing: " + this.#model.getPassing() + "\n");
                if (this.#model.getPassing() != 'none') {
                    out_ta.append("Use 'controller passCards <card1> <card2> <card3>' to pass\n");
                    out_ta.append("Your hand:\n");
                    out_ta.append(this.#model.getHand('south').toString());
                }
            } else if (this.#model.getState() == 'playing') {
                out_ta.append("Passes complete, game starting.\n");
            } else if (this.#model.getState() == 'complete') {
                let winner = null;
                let winning_score = 200;
                HU.positions.forEach(p => {
                    if (this.#model.getScore(p) < winning_score) {
                        winning_score = this.#model.getScore(p);
                        winner = p;
                    }
                });
                out_ta.append(`Match over, ${this.#model.getPlayerName(winner)} wins!\n`);
            }
        })

        this.#model.addEventListener('trickstart', () => {
            out_ta.append("Trick started\n");
            if (this.#model.getCurrentTrick().nextToPlay() == 'south') {
                out_ta.append("Your turn to play. Use 'controller playCard <card>'.\n");
                out_ta.append("Your hand:\n" + this.#model.getHand('south').toString());
            }
        });

        this.#model.addEventListener('trickplay', (e) => {
            out_ta.append(this.#model.getPlayerName(e.detail.position) + " played the " + e.detail.card.toString() + "\n");
            if (this.#model.getCurrentTrick().nextToPlay() == 'south') {
                out_ta.append("Your turn to play. Use 'controller playCard <card>'.\n");
                out_ta.append("Your hand:\n" + this.#model.getHand('south').toString());
            }
        });

        this.#model.addEventListener('trickcollected', (e) => {
            out_ta.append("Trick won by " + this.#model.getPlayerName(e.detail.position) + "\n");
        });

        this.#model.addEventListener('scoreupdate', (e) => {
            if (e.detail.moonshooter != null) {
                alert(this.#model.getPlayerName(e.detail.moonshooter) + " shot the moon!");
            }
            out_ta.append(`Score update: 
  ${this.#model.getPlayerName('north')}: ${e.detail.entry.north}
  ${this.#model.getPlayerName('east')} : ${e.detail.entry.east}
  ${this.#model.getPlayerName('south')}: ${e.detail.entry.south}
  ${this.#model.getPlayerName('west')} : ${e.detail.entry.west}\n`);
            out_ta.append(`Current totals: 
  ${this.#model.getPlayerName('north')}: ${this.#model.getScore('north')}
  ${this.#model.getPlayerName('east')} : ${this.#model.getScore('east')}
  ${this.#model.getPlayerName('south')}: ${this.#model.getScore('south')}
  ${this.#model.getPlayerName('west')} : ${this.#model.getScore('west')}\n`);
        });

        // Uncomment the following line if you want to see four robots
        // play each other instead of entering commands
        let south_robot = new HeartsRobotKmp(this.#model, this.#controller, 'south');

        let west_robot = new HeartsRobotKmp(this.#model, this.#controller, 'west');
        let north_robot = new HeartsRobotKmp(this.#model, this.#controller, 'north');
        let east_robot = new HeartsRobotKmp(this.#model, this.#controller, 'east');

        this.#controller.startGame('Alice', 'Bob', 'You', 'Mike');
    }

    #parseCard(cstr) {
        let rank_char = cstr[0];
        let suit_char = cstr[1];

        let rank;
        if (rank_char == 'T' || rank_char == 't') {
            rank = 10;
        } else if (rank_char == 'J' || rank_char == 'j') {
            rank = 11;
        } else if (rank_char == 'Q' || rank_char == 'q') {
            rank = 12;
        } else if (rank_char == 'K' || rank_char == 'k') {
            rank = 13;
        } else if (rank_char == 'A' || rank_char == 'a') {
            rank = 14;
        } else {
            rank = parseInt(rank_char);
        }
        let suit;
        if (suit_char == 'H' || suit_char == 'h') {
            suit = 'hearts';
        } else if (suit_char == 'S' || suit_char == 's') {
            suit = 'spades';
        }
        if (suit_char == 'C' || suit_char == 'c') {
            suit = 'clubs';
        }
        if (suit_char == 'D' || suit_char == 'd') {
            suit = 'diamonds';
        }

        return new Card(suit, rank);
    }
}