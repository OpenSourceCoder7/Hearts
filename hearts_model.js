import {HU} from "./hearts_utils.js";

export class HeartsModel extends EventTarget {
    #playerNames;
    #state;
    #scorelog;
    #hands;
    #current_trick;
    #collected_tricks;
    #passing;


    constructor() {
        super();

        this.#playerNames = {
            north: null,
            east: null,
            south: null,
            west: null
        };

        this.#state = 'uninitialized';

        this.#scorelog = [];

        this.#hands = {
            north: null,
            east: null,
            south: null,
            west: null
        };
    
        this.#collected_tricks = {
            north: [],
            east: [],
            south: [],
            west: []
        };
    }
    
    // Private methods
    #dealCards () {
        let deck = [];
        ['spades', 'hearts', 'diamonds', 'clubs'].forEach(suit => {
            [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].forEach(rank => {
                deck.push(new Card(suit, rank));
            })
        });
        deck = deck.map((card) => [card, Math.random()]).sort((a,b) => a[1]-b[1]).map((cpair) => cpair[0]);
        return {
            north: new Hand(deck.slice(0,13)),
            east: new Hand(deck.slice(13,26)),
            south: new Hand(deck.slice(26,39)),
            west: new Hand(deck.slice(39,52))
        };
    }

    // These methods are only available to controller to update model.
    // They should never be called from view objects.

    initialize (north_name, east_name, south_name, west_name) {
        if (this.#state != 'uninitialized') return;

        this.#playerNames.north = north_name;
        this.#playerNames.east = east_name;
        this.#playerNames.south = south_name;
        this.#playerNames.west = west_name;

        this.#scorelog = [];
        this.setupGame('right');
    };

    passCards (cards_to_pass) {
        if (this.#state != 'passing') return;

        HU.positions.forEach(p => this.#hands[p].remove(cards_to_pass[p]));
        HU.positions.forEach(p => {
            let pass_to = HU.passing_maps[this.#passing][p];
            this.#hands[pass_to].add(cards_to_pass[p]);
        });

        this.#state = 'playing';

        let lead = HU.positions.find(p => this.#hands[p].contains(Card.TWO_OF_CLUBS));
        
        this.#current_trick = new Trick(lead);

        this.dispatchEvent(new Event('stateupdate'));
        this.dispatchEvent(new Event('trickstart'));
    };

    playCardIntoTrick (position, card) {
        if (this.#state != 'playing') return;

        this.#hands[position].remove([card]);
        this.#current_trick.playCard(card);
        this.dispatchEvent(new CustomEvent('trickplay', {detail: {
            position: position,
            card: card
        }}));

        if (this.#current_trick.isComplete()) {
            this.dispatchEvent(new Event('trickend'));
        } 
    };

    collectTrick (position) {
        if (this.#state != 'playing') return;

        this.#collected_tricks[position].push(this.#current_trick);
        this.dispatchEvent(new CustomEvent('trickcollected', {detail: {
            position: position,
            trick: this.#current_trick}
        }));
        this.#current_trick = null;
    };

    setupTrick (position) {
        if (this.#state != 'playing') return;

        this.#current_trick = new Trick(position);
        this.dispatchEvent(new Event('trickstart'));
    };

    updateScoreLog (scorelog_entry, moonshooter) {
        this.#scorelog.push(scorelog_entry);
        this.dispatchEvent(new CustomEvent('scoreupdate', {detail: {
            entry: scorelog_entry,
            moonshooter: moonshooter
        }}));
    };

    setupGame (passing) {
        if ((this.#state == 'complete') || (this.#state == 'passing')) return;

        this.#passing = passing;
        this.#hands = this.#dealCards();
        this.#current_trick = null;
        this.#collected_tricks = {
            north: [],
            east: [],
            south: [],
            west: []
        };
        this.#state = 'passing';

        this.dispatchEvent(new Event('stateupdate'));
    };

    matchOver () {
        this.#state = 'complete';
        this.dispatchEvent(new Event('stateupdate'));
    };

    // These methods are available to view objects to query model information 
    
    getState () {
        return this.#state;
    }

    getPlayerName (position) {
        return this.#playerNames[position];
    };

    getCurrentGamePoints (position) {
        return this.#collected_tricks[position].reduce((sum, trick) => sum + trick.getPoints(), 0);
    };

    getScoreLog () {
        return this.#scorelog;
    };

    getScore (position) {
        return this.#scorelog.reduce((score, entry) => score + entry[position], 0);
    }

    getPassing() {
        return this.#passing;
    }

    getCurrentTrick () {
        return this.#current_trick;
    }

    getTricksLeft () {
        return 13 - HU.positions.reduce((sum, p) => sum += this.#collected_tricks[p].length, 0);
    }

    getHand (position) {
        return this.#hands[position];
    }

    getCollectedTricks(position) {
        return this.#collected_tricks[position];
    }
}

export class Card {
    #suit
    #rank

    static TWO_OF_CLUBS = new Card('clubs', 2);
    static QUEEN_OF_SPADES = new Card('spades', 12);

    constructor (suit, rank) {
        this.#suit = suit;
        this.#rank = rank;
    }

    toString() {
            return `${this.getRankName()} of ${this.getSuit()}`;
    }

    getSuit() {
        return this.#suit;
    }

    getRank() {
        return this.#rank;
    }

    getRankName() {
        let honors_map = {};
        honors_map[11] = 'jack';
        honors_map[12] = 'queen';
        honors_map[13] = 'king';
        honors_map[14] = 'ace';

        return this.#rank < 11 ? this.#rank.toString() : honors_map[this.#rank];
    }

    equals(other) {
        return (other.getRank() == this.#rank) && (other.getSuit() == this.#suit);
    }
}


export class Trick {
    #lead;
    #next_to_play;
    #played_by_position;

    static #next_to_play_map = {
        north: 'east',
        east: 'south',
        south: 'west',
        west: 'north'
    };

    constructor(lead) {
        this.#lead = lead;
        this.#next_to_play = lead;
        this.#played_by_position = {
            north: null,
            east: null,
            south: null,
            west: null
        }
    }

    getLead() {
        return this.#lead;
    }

    getLeadSuit() {
        return this.getCard(this.getLead()).getSuit();
    }

    nextToPlay () {
        return this.#next_to_play;
    }

    playCard (card) {
        this.#played_by_position[this.#next_to_play] = card;
        this.#next_to_play = this.isComplete() ? null : Trick.#next_to_play_map[this.#next_to_play];
    }

    getCard(position) {
        return this.#played_by_position[position];
    }

    isComplete() {
        return !HU.positions.find(p => this.#played_by_position[p] == null);
    };

    getPoints() {
        return HU.positions.map(p => this.#played_by_position[p])
                           .filter(c => c != null)
                           .reduce((points, c) => points + 
                                    (c.equals(Card.QUEEN_OF_SPADES) ? 13 : 
                                     ((c.getSuit() == 'hearts') ? 1 : 0)), 0);
    }

    toString() {
        return `next to play: ${this.#next_to_play}
north: ${this.#played_by_position.north}
east : ${this.#played_by_position.east}
south: ${this.#played_by_position.south}
west : ${this.#played_by_position.west}
`
    }
}

export class Hand extends EventTarget {
    #cards;

    constructor (cards) {
        super();
        this.#cards = cards;
    }

    contains (card) {
        return this.#cards.some(c => c.equals(card));
    }

    hasSuit(suit) {
        return this.#cards.some(c => c.getSuit() == suit);
    }

    hasOnlyHearts() {
        return !this.#cards.some(c => c.getSuit() != 'hearts');
    }

    add (cards) {
        if (cards.length == 0) return;

        this.#cards.push(...cards);
        this.dispatchEvent(new CustomEvent('update', {detail:
            {type: 'add', cards: [...cards]}}));
    }

    remove (cards) {
        if (cards.length == 0) return;
        
        cards.forEach((c_to_remove) => {
            this.#cards = this.#cards.filter((c) => !c.equals(c_to_remove));
        });
        this.dispatchEvent(new CustomEvent('update', {detail:
            {type: 'remove', cards: [...cards]}}));
    }

    getCards () {
        return [...this.#cards];
    }

    toString() {
        return `Hearts  : ${this.#cards.filter(c=> c.getSuit() == 'hearts').sort((a,b) => a.getRank() - b.getRank()).map(c => c.getRankName()).join()}
Spades  : ${this.#cards.filter(c=> c.getSuit() == 'spades').sort((a,b) => a.getRank() - b.getRank()).map(c => c.getRankName()).join()}
Diamonds: ${this.#cards.filter(c=> c.getSuit() == 'diamonds').sort((a,b) => a.getRank() - b.getRank()).map(c => c.getRankName()).join()}
Clubs   : ${this.#cards.filter(c=> c.getSuit() == 'clubs').sort((a,b) => a.getRank() - b.getRank()).map(c => c.getRankName()).join()}
`;
    }
}