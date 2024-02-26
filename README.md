# A03 - Game of Hearts

In this assignment, you'll create a user interface for the game of Hearts. 
If you are unfamiliar with this game, see [here](https://bicyclecards.com/how-to-play/hearts/) for the rules. Here is a reasonable on-line version of the game: https://cardgames.io/hearts/.

You will only need to write the view components of the game. I have already provided
the model and controller. The file hearts.html is the game page. It loads hearts.js as a
module. That file imports the model and controller from hearts_model.js and hearts_controller.js. You are responsible for completing the code in hearts_view.js which
should render your interface in the main div of hearts.html and interact with the model and controller components to provide a user interface. 

A command line interface version has been provided in hearts_cli.html, hearts_cli.js, and hearts_cli_view.js. This is the version that I demonstrated in class. Feel free to look at this code to understand how to work with the model and controller objects.

Your view components should only interact with the model and controller components as described in the model and controller references below. In particular, you should not call any model or controller component methods that are not specifically described in the reference or create new model objects other than Card.

Your view components should register as listeners of model object events as necessary. The events (if any) dispatched by a model object are described in the model reference.

When your UI first renders, it should be providing an interface for setting the name of the user playing. Optionally, your UI may provide a way of setting the names of the robot players or those may be set statically. Once name information is established, your code should create three robot objects (see HeartsRobotKmp in hearts_robot_kmp.js) and start the game by calling the controller's ```startGame()``` method. 

Once started, your UI should provide an interface for passing and playing cards out of your user's hand as appropriate. As rounds are completed, the score of the game should be displayed to the user in some way when updated. There should be some sort of indication when the game is over and who won. Otherwise, you are free to make the interface work however you wish. Your interface should NOT, however, rely on using 'alert()'.

### Grading Rubric

70 points for basic functionality as described above. A 20 point deduction if your interface causes or could used in a way that causes a controller error alert.

10 points for including any of the following:
* Sound effects
* Animation effects when passing or playing cards.

10 points for writing your own robot that does something other than picking cards at random. If you write 
your own robot, please be sure to use same constructor form as HeartsRobotKmp.

5 points for completing your peer reviews.

Up to 5 points as the average of the peer reviews given to you using the following 0-5 scale:

* 0: No Submission
* 1: Poorly designed, interface is difficult to use.
* 2: Meets requirements of assignment but not much to it other than that.
* 3: Great user experience and pleasing design.
* 4: Better than most other submissions but not necessarily the best.
* 5: Professional-level design and operation. Could reasonably be nominated for best   
     interface.

Sumbit your repository to GradeScope and fill out the following attestation form:
https://docs.google.com/forms/d/e/1FAIpQLSfku-bOKYcjGr8oN3xhjzqos-Vv_Z7p9fDPpNb8n4FZJkjVrA/viewform?usp=sf_link

# Model Reference

## HeartsModel

The HeartsModel object represents the overall game model. The following methods are available to get information about the game:

* getState()
  
  Returns the current state of the game as one of the following strings:
  * unitialized

    This is the initial state when first created. Requires a call
    to the controller's startGame method to initialize the model and get the game going.

  * passing

    The game is in the "passing" state when waiting for players to pass cards to each other before starting the next round. Once all players have passed cards, the controller will update the model to be in the playing state and start the next trick.

  * playing

    The game is in "playing" state during a round. Once the last trick of the round is complete, the controller will update the score, and set up the next round and enter the passing state unless at least one player is over 100 points in which case the game is over.

  * complete

    The game is in the "complete" state when the game is over.

* getPlayerName(position)

  Returns the name of the player in the specified position (one of 'north',
  'east', 'south', or 'west').

* getCurrentGamePoints(position) 

  Returns the number of points in the tricks collected by the player in the 
  specified position for the current round.

* getScoreLog()

  Returns an array of entries showing the points for each completed round. Each entry
  has the following form:

  ```
  {
    north:  integer,
    east:   integer,
    south:  integer,
    west:   integer
  }
  ```

* getScore(position)

  Returns the current score of the player at the specified position. This only includes
  completed rounds (i.e., sum of values in the score log). It does not include the points
  of the current round if in progress.

* getPassing()

  Returns the passing pattern for the round. One of 'right', 'left', 'across', or 'none'.

* getCurrentTrick()

  Returns a Trick object representing the current trick. If not in the 'playing' state, 
  returns null. See below for a description of Trick.

* getTricksLeft()

  Returns the number of tricks left in the current round (including the current trick).

* getHand(position)

  Returns a Hand object representing the cards currently in the hand of the player
  at the specified position. Robot players are trusted to only
  look at the hand they should have access to. Note that a new Hand object associated with a player is created at the time the hand is dealt when a round is set up.

* getCollectedTricks(position)

  Returns an array of Trick objects representing the tricks collected by the player
  in the specified position in the current round.

### HeartsModel Events

Because HeartsModel extends EventTarget, you can directly register a listener using
addEventListener and otherwise use HeartsModel as an EventTarget. The following events are generated. Registered listeners are invoked with an event object as a parameter. Some events are delivered with additional information in that event object's ```detail``` property as described here.

* stateupdate
  
  This event is generated whenever the HeartsModel state changes. The initial state update event is generated when the model goes from 'unitialized' to 'passing' indicating the start of the first round's passing phase. After the controller reports the passed cards to the model, it is generated again as the state changes to 'playing'. Subsequent sequences of state updates from 'playing' to 'passing' and back are generated by each subsequent round. If any player has more than 100 points at the end of the round, the state is updated to 'complete', generating the last state update event.

* trickstart

  This event is generated at the start of each trick. The current Trick object is retrievable and should be in its initial state (i.e., no cards played into it).

* trickplay

  This event is generated whenever a card is played into the trick. The position and card played available in detail as:

```
  {position: 'north' | 'east' | 'south' | 'west',
   card:     Card}
```

* trickend

  This event is generated after the trick is complete. The trick is still available
  by using getCurrentTrick().
  
* trickcollected

  Note that when handling this event, using getCurrentTrick() will return null. The collected trick and the position that collected the trick is available in the event detail as:

```
  {position: 'north' | 'east' | 'south' | 'west',
   trick:    Trick}
```

* scoreupdate

  This event is generated after all of the tricks of the current round have been played and the score log updated. The new score log entry and an indication if this represents "shooting the moon" is available in the event detail as:

```
    {entry: {
      north: integer,
      east:  integer,
      south: integer,
      west:  integer},
      moonshooter: null | 'north' | 'east' | 'south' | 'west' 
    }
```

## Hand
A Hand object has the following methods that you are allowed to use. You are NOT allowed to use any methods of Hand not specified below:

* contains(card)

  Returns true or false depending on whether the hand contains the specified card. See
  the description of the Card object below.
  
* hasSuit(suit)

  Returns true or false depending on whether the hand contains the specified suit
  (one of 'hearts', 'spades', 'clubs', or 'diamonds').

* hasOnlyHearts()

  Returns true or false depending on whether the hand contains only hearts or not.

* getCards ()

  Returns an array of Card objects currently in the Hand in no particular order.

### Hand Events

Hand objects generate only one type of event, 'update'. This event is generated whenever cards are added or removed from the Hand. When passing, one update event is generated when all thre cards are removed from a Hand followed by one update event is generated when all three cards are inserted. When playing, an event is generated whenever a card is played out of the Hand. An indication of whether cards were added or removed and an array of the cards are available in the event detail as follows:

```
{ 
    type: 'add' | 'remove',
    cards: array of Card objects
 }
 ```

## Card
A Card object represents a card of a particular suit and rank. Suits are 
represented by the strings 'hearts', 'spades', 'clubs', and 'diamonds'. 
Ranks are represented as numbers from 2 to 14 where the values 11, 12, 13, and 14 correspond to the face cards Jack, Queen, King, and Ace respectively. 
You can create new Card objects to represent a specific card as necessary. 

Other methods of Card objects include:

* toString()

  Returns a string representation of the card.
  
* getSuit()

  Returns the suit of the card.
  
* getRank()

  Returns the rank value of the card.
  
* getRankName()

  Returns the rank as a string. The rank values 2 through 10 are simply those
  values as strings. The rank values 11, 12, 13, and 14 are returned as the
  strings 'jack', 'queen', 'king', and 'ace' respectively.

* equals(other)

  Returns true or false depending on whether the Card object passed in as other
  has the same suit and rank.

## Trick

A Trick object represents the cards of a trick. The current trick being played retrieved by the getCurrentTrick() method of the HeartsModel object will be incomplete (i.e., one or more of the positions will have null as a card). Trick objects returned by the 
getCollectedTricks method of the HeartsModel object will be complete. 

You should never need to create a Trick object yourself and you should limit yourself
to the following methods:

* getLead()

  Returns the position that played (or will play) the first card into the trick.

* getLeadSuit()

  Returns the suit of the lead card (if it has been played, will cause an error if
  not yet played).

* nextToPlay()

  For incomplete tricks, returns the position of the next player expected to play into the trick. One tip: the lead card has been played if nextToPlay() != getLead(). Otherwise, should be considered meaningless if the trick is complete.

* getCard(position)

  Returns the card played into the trick by the specified position. Returns null if that player has not yet played a card.

* isComplete()

  Returns true if all players have played a card into the trick.

* getPoints()

  Returns the number of points currently in the trick. Any hearts are 1 point and
  the queen of spades is 13 points.

# Controller Reference

There are only four methods of the controller that you should need. 

* startGame(north_name, east_name, south_name, west_name)

Asks the controller to start the game given the player names. Should only be called once to start the game. Returns immediately but causes changes to model objects that may generate events. 

* playCard(position, card) 

Asks the controller to play the specified card as the specified position. Will cause a controller error if called inappropriately (i.e., out of position, with a card not in that position's hand, etc.). Returns immediately but causes changes to model objects that may generate events. 

* passCard(position, cards)

Reports to the controller the cards to be passed by the specified position as an array of Card objects. Will cause a controller error if called inappropriately (i.e., not in passing state, fewer or more than 3 cards, etc). Returns immediately but causes changes to model objects that may generate events. 

* isPlayable(position, card)

Can be used to test whether or not a particular card is playable by a particular position. Does not cause any model updates or changes of any sort.