import { HU } from "./hearts_utils.js";
import { Card } from "./hearts_model.js";

export class HeartsController {

    #model;
    #cards_to_pass;
    #hearts_broken;

    constructor(model) {
        this.#model = model;
        this.#model.addEventListener('trickend', () => this.#handleTrickEnd());
    }

    #doAsync() {
        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    startGame(north_name, east_name, south_name, west_name) {
        this.#cards_to_pass = {
            north: [],
            east: [],
            south: [],
            west: []
        };
        this.#hearts_broken = false;
        this.#doAsync().then(() => {
            this.#model.initialize(north_name, east_name, south_name, west_name);
        });
    }

    passCards(position, cards) {
        if (this.#model.getState() != 'passing') {
            alert('Controller error: attempt to pass cards when not in passing state');
            return;
        }

        if (this.#model.getPassing() == 'none') {
            alert('Controller error: attempt to pass cards when passing is none');
            return;
        }

        if (cards.length != 3) {
            alert('Controller error: attempt to pass more/less than three cards');
            return;
        }

        let hand = this.#model.getHand(position);
        if (cards.some(c => !hand.contains(c))) {
            alert('Controller error: attempt to pass a card not in the hand of position');
            return;
        }

        if (this.#cards_to_pass[position].length != 0) {
            alert('Controller error: attempt to pass cards twice');
            return;
        }

        this.#cards_to_pass[position] = [...cards];

        if (!HU.positions.find(p => this.#cards_to_pass[p].length == 0)) {
            this.#doAsync().then(() => {
                this.#model.passCards(this.#cards_to_pass);
                this.#cards_to_pass = {
                    north: [],
                    east: [],
                    south: [],
                    west: []
                }
            });
        }
    }

    isPlayable(position, card) {
        let cur_trick = this.#model.getCurrentTrick();
        let hand = this.#model.getHand(position);

        if (cur_trick.getLead() == position) {
            // If lead of first trick in game, then only 2 of clubs is playable.
            if (this.#model.getTricksLeft() == 13) {
                return card.equals(Card.TWO_OF_CLUBS);
            }

            // Can only lead hearts if hearts are broken or hand only has hearts.
            if (card.getSuit() == 'hearts') {
                if (!this.#hearts_broken) {
                    return hand.hasOnlyHearts();
                }
            }
            return true;
        } else {
            let lead_card = cur_trick.getCard(cur_trick.getLead());
            if (!lead_card) {
                return false;
            }
            if (!hand.hasSuit(lead_card.getSuit())) {
                return true;
            }
            return card.getSuit() == lead_card.getSuit();
        }
    }

    playCard(position, card) {
        if (this.#model.getState() != 'playing') {
            alert('Controller error: playCard called when not in playing state.');
            return;
        }

        if (this.#model.getCurrentTrick().nextToPlay() != position) {
            alert('Controller error: attempt to play card out of position');
            return;
        }

        if (!this.#model.getHand(position).contains(card)) {
            alert('Controller error: attmept to play card not in hand');
            return;
        }

        if (!this.isPlayable(position, card)) {
            alert('Controller error: attmept to play unplayable card');
            return;
        }

        this.#doAsync().then(() => {
            this.#model.playCardIntoTrick(position, card);
            this.#hearts_broken ||= (card.getSuit() == 'hearts');
        });
    }

    #handleTrickEnd() {
        // Figure out who won.
        let cur_trick = this.#model.getCurrentTrick();
        let winner = cur_trick.getLead();
        let winning_card = cur_trick.getCard(winner);

        HU.positions.forEach(position => {
            if (winner != position) {
                let card = cur_trick.getCard(position);
                if ((card.getSuit() == winning_card.getSuit()) &&
                    (card.getRank() > winning_card.getRank())) {
                    winning_card = card;
                    winner = position;
                }
            }
        });
        
        this.#doAsync().then(() => this.#model.collectTrick(winner))
            .then(() => {
                if (this.#model.getTricksLeft() > 0) {
                    this.#model.setupTrick(winner);
                    return false;
                } else {
                    // Game's over.
                    // Create scorelog entry (detect shooting the moon)
                    // Update scorelog
                    // Detect possible match end.
                    // Figure out next passing mode and set up next game.

                    //                let scorelog_entry = HU.positions.reduce((entry, pos) => entry[pos] = this.#model.getCurrentGamePoints(pos), {});
                    let scorelog_entry = {
                        north: this.#model.getCurrentGamePoints('north'),
                        east: this.#model.getCurrentGamePoints('east'),
                        south: this.#model.getCurrentGamePoints('south'),
                        west: this.#model.getCurrentGamePoints('west'),
                    };

                    let moonshooter = HU.positions.find(p => scorelog_entry[p] == 26);
                    if (moonshooter) {
                        HU.positions.forEach(p => {
                            scorelog_entry[p] = (scorelog_entry[p] + 26) % 52;
                        });
                    } else {
                        moonshooter = null;
                    }

                    this.#model.updateScoreLog(scorelog_entry, moonshooter);
                    return true;
                }
            })
            .then((game_over) => {
                if (game_over) {
                    if (HU.positions.find(p => this.#model.getScore(p) >= 100)) {
                        this.#model.matchOver();
                    } else {
                        let next_passing = HU.next_passing_map[this.#model.getPassing()];
                        this.#hearts_broken = false;
                        this.#cards_to_pass = {
                            north: [],
                            east: [],
                            south: [],
                            west: []
                        };
                        this.#model.setupGame(next_passing);

                        if (next_passing == 'none') {
                            this.#doAsync().then(() => this.#model.passCards(this.#cards_to_pass));
                        }
                    }
                }
            });
    }
}
