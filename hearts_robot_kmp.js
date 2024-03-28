export class HeartsRobotKmp {
    #model;
    #controller;
    #position;
    #todo_list;
    #doSlowly(fn) {
        this.#todo_list.push(fn);
      };
    
    
   
    

    constructor(model, controller, position) {
        this.#model = model;
        this.#controller = controller;
        this.#position = position;
        this.#todo_list = [];

        setInterval(() => {
            if (this.#todo_list.length >  0){
              let next_todo = this.#todo_list.shift();
              next_todo();
      
            }
          }, 50);
        

        this.#model.addEventListener('stateupdate', () => this.#doSlowly(()=> {
            let state = this.#model.getState();
            if ((state == 'passing') && (this.#model.getPassing() != 'none')) {
                let hand = this.#model.getHand(this.#position);
                let cards_to_pass = hand.getCards()
                                        .map(c => [c, Math.random()])
                                        .sort((a,b) => a[1] - b[1])
                                        .slice(0, 3)
                                        .map(cr => cr[0]);
                this.#controller.passCards(this.#position, cards_to_pass);  
            } 
        }));
        
        
        this.#model.addEventListener('trickstart', () => this.#doSlowly(()=>{this.#playCard()}));
        this.#model.addEventListener('trickplay', () => this.#doSlowly(()=>{this.#playCard()}));
        
        
    }
    

    #playCard() {
        if (this.#model.getCurrentTrick().nextToPlay() == this.#position) {
            let playable_cards = this.#model.getHand(this.#position)
                                            .getCards()
                                            .filter(c => this.#controller.isPlayable(this.#position, c));
            if (playable_cards.length > 0) {
                let card = playable_cards.map(c => [c, Math.random()])
                                          .sort((a,b) => a[1] - b[1])[0][0];
                this.#controller.playCard(this.#position, card);
            } else {
                // This should never happen.
                console.log(`${this.#position} has no playable cards`);
            }
        }
    }
}