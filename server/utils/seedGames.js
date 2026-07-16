import games from '../database/games';
import { fetchSeedCovers } from './seedCovers';

// prettier-ignore
const seed = [
	{
		name: 'Yahtzee',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Original_Yahtzee_game_set_-_1980s_UK_release.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 1, playersMax: 10,
		playTimeMin: 30, playTimeMax: 45,
		tags: ['push-your-luck', 'dice-game'],
		description: 'Roll five dice to fill thirteen scoring categories.',
		rules: `Each turn, roll five dice up to three times, setting aside any dice you want to keep between rolls.
After your third roll, score the dice in one open category on your sheet (upper section: ones through sixes; lower section: three/four of a kind, full house, small/large straight, yahtzee, chance).
Each category may only be used once, if nothing fits, you must take a zero somewhere.
Upper section bonus: 35 points if your upper total is 63+.
Yahtzee (five of a kind) scores 50; extra yahtzees score a 100 bonus each.
Highest total after all thirteen rounds wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Yahtzee' }],
	},
	{
		name: 'Farkle',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Six_Farkle_dice.jpg/3840px-Six_Farkle_dice.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 8,
		playTimeMin: 20, playTimeMax: 45,
		tags: ['push-your-luck', 'party', 'dice-game'],
		description: 'Bank points from scoring dice, but roll one dud hand and lose it all.',
		rules: `Roll six dice. Set aside at least one scoring die or combo each roll: single 1 = 100, single 5 = 50, three of a kind = face value x 100 (three 1s = 1000), straight 1-6 = 1500, three pairs = 1500.
After setting scoring dice aside you may bank your turn total or re-roll the remaining dice.
If a roll contains no scoring dice, you "farkle", lose everything accumulated this turn.
If all six dice score, pick them all up and keep rolling ("hot dice").
You need 500 in one turn to get on the board. First to 10,000 triggers the final round; everyone else gets one more turn.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Farkle' }],
	},
	{
		name: "Liar's Dice",
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Perudo.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 6,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['bluffing', 'party', 'elimination', 'dice-game'],
		description: 'Hidden dice and escalating bids: call the bluff or raise the stakes.',
		rules: `Everyone starts with five dice and a cup. All players roll simultaneously and peek at their own dice only.
The first player bids a quantity of a face value across ALL dice on the table (e.g. "four 3s"). Each next player must raise the bid (more dice, or same count of a higher face) or challenge by calling "liar!".
On a challenge, everyone reveals. If the bid stands (at least that many), the challenger loses a die; otherwise the bidder loses one.
Ones are usually wild and count as any face.
Lose all your dice and you're out. Last player with dice wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Liar%27s_dice' }],
	},
	{
		name: 'Pig',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Dice_%28504524747%29.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 10, playTimeMax: 20,
		tags: ['kids', 'push-your-luck', 'dice-game'],
		description: 'One die, one decision: roll again or hold.',
		rules: `On your turn, roll a single die as many times as you like, adding each roll to your turn total.
Roll a 1 and you lose the whole turn total; your turn ends immediately.
Say "hold" at any point to bank your turn total into your score and pass the die.
First player to 100 points wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Pig_(dice_game)' }],
	},
	{
		name: "Texas Hold'em Poker",
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Holdem.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2, playersMax: 10,
		playTimeMin: 30, playTimeMax: 120,
		tags: ['52-card', 'bluffing', 'gambling', 'card-game', 'poker'],
		description: 'The classic community-card poker game.',
		rules: `Each player gets two hole cards face down. Five community cards are dealt face up in stages: the flop (3), the turn (1), and the river (1).
Betting rounds happen before the flop and after each stage, call, raise, or fold.
Best five-card hand from any combination of your two hole cards and the five community cards wins the pot at showdown.
Hand ranks (high to low): royal flush, straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card.
The two players left of the dealer post small/big blinds to seed the pot; the deal rotates each hand.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Texas_hold_%27em' }],
	},
	{
		name: 'Gin Rummy',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/3_playing_cards.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2, playersMax: 2,
		playTimeMin: 20, playTimeMax: 45,
		tags: ['52-card', 'melding', 'card-game'],
		description: 'Race to meld your hand into sets and runs.',
		rules: `Deal ten cards each. On your turn, draw from the stock or the discard pile, then discard one card.
Build melds: sets (3-4 of the same rank) or runs (3+ consecutive cards of the same suit).
Unmatched cards are "deadwood" (face cards = 10, aces = 1). Knock when your deadwood totals 10 or less; go "gin" (25 point bonus) with zero deadwood.
After a knock, the opponent may lay off their deadwood onto your melds. Score the difference in deadwood; if the knocker doesn't have less, the opponent scores the difference plus a 25 point undercut bonus.
First to 100 points wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Gin_rummy' }],
	},
	{
		name: 'Hearts',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/English_pattern_cards_-_Suit_of_Hearts_-_IMG_7731.jpg/3840px-English_pattern_cards_-_Suit_of_Hearts_-_IMG_7731.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 3, playersMax: 6,
		playTimeMin: 30, playTimeMax: 60,
		tags: ['52-card', 'trick-taking', 'card-game'],
		description: 'Avoid hearts and the queen of spades: or shoot the moon.',
		rules: `Deal the whole deck (4 players = 13 each). Before each hand, pass three cards (left, right, across, hold, rotating each hand).
The 2 of clubs leads the first trick. Follow suit if you can; highest card of the led suit takes the trick and leads next.
Hearts can't be led until one has been "broken" (discarded on another suit's trick).
Each heart taken = 1 point, queen of spades = 13 points. Points are bad.
Shoot the moon (take ALL hearts + the queen) and everyone else gets 26 instead.
When someone reaches 100, lowest score wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hearts_(card_game)' }],
	},
	{
		name: 'Spades',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Spades_%284371711785%29.jpg/3840px-Spades_%284371711785%29.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 4, playersMax: 4,
		playTimeMin: 45, playTimeMax: 90,
		tags: ['52-card', 'trick-taking', 'partnership', 'card-game', 'bidding'],
		description: 'Partnership trick-taking where spades always trump.',
		rules: `Four players in two partnerships; deal thirteen cards each. Each player bids how many tricks they'll take; partners' bids combine into a contract.
Follow suit if possible. Spades are always trump but can't be led until broken.
Make your combined contract: 10 points per bid trick, +1 per overtrick ("bag"). Collect ten bags and lose 100 points.
Miss the contract and lose 10 points per bid trick.
Bidding "nil" (zero tricks) scores ±100 on its own, on top of the partner's bid.
First partnership to 500 wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Spades_(card_game)' }],
	},
	{
		name: 'Euchre',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Euchre.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 4, playersMax: 4,
		playTimeMin: 30, playTimeMax: 45,
		tags: ['52-card', 'trick-taking', 'partnership', 'card-game'],
		description: 'Fast partnership trump game played with 24 cards.',
		rules: `## Setup

Use only **9-10-J-Q-K-A** of each suit (24 cards). Deal five to each player, turn one up as the proposed trump.

## Calling trump

- In turn, players may order the dealer to pick it up (fixing trump) or pass
- If all pass, a second round lets anyone name a different trump suit
- The jack of trump (*right bower*) is the highest card; the other same-color jack (*left bower*) is second highest

## Scoring

The team that called trump must take 3 of 5 tricks:

| Result | Points |
|---|---|
| 3-4 tricks | 1 |
| All five (*march*) | 2 |
| Fail (*euchred*) | 2 to defenders |
| Lone hand march | 4 |

Call trump and play alone (partner sits out) for the lone hand bonus.

> [!NOTE]
> First team to 10 points wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Euchre' }],
	},
	{
		name: 'Go Fish',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Playing_Cards_-_number_fives.jpg/3840px-Playing_Cards_-_number_fives.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 6,
		playTimeMin: 10, playTimeMax: 20,
		tags: ['52-card', 'kids', 'card-game'],
		description: 'Ask for cards, collect books of four.',
		rules: `Deal 5 cards each (7 for two players); the rest is the "pond".
On your turn, ask a specific player for a rank you already hold ("Got any sevens?"). If they have any, they hand them all over and you ask again. If not, "go fish": draw from the pond, and your turn ends unless you drew what you asked for.
Complete a book (all four of a rank) and lay it down.
When all books are made, most books wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Go_Fish' }],
	},
	{
		name: 'Crazy Eights',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Crazy_Eights.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 7,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'shedding', 'card-game'],
		description: 'Match suit or rank, eights are wild: the ancestor of Uno.',
		rules: `Deal 5 cards each (7 for two players); flip one card to start the discard pile.
On your turn, play a card matching the top discard's suit or rank. Eights are wild, play one and name the new suit.
Can't play? Draw until you can (or draw one and pass, house-rules permitting).
First to empty their hand wins the round; opponents' remaining cards score against them (8 = 50, faces = 10, others = face value). Play to 100+.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Crazy_Eights' }],
	},
	{
		name: 'Klondike Solitaire',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/GNOME_Aisleriot_Solitaire_%28cropped%29.png' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 1, playersMax: 1,
		playTimeMin: 10, playTimeMax: 20,
		tags: ['52-card', 'card-game'],
		description: 'The solitaire: build the four suits from ace to king.',
		rules: `Deal seven tableau piles of 1-7 cards, only the top card face up. The rest becomes the stock.
Build tableau piles downward in alternating colors. Move face-up runs between piles; flip a pile's newly exposed card face up. An empty pile takes only a king.
Flip stock cards (1 or 3 at a time) to a waste pile; the top waste card is playable.
Move aces to foundations as they appear and build each suit up ace through king.
Win by getting all 52 cards onto the foundations.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Klondike_(solitaire)' }],
	},
	{
		name: 'War',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Wojna_gra_karciana.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 2,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['52-card', 'kids', 'card-game'],
		description: 'Flip cards, highest takes both. Pure luck, zero decisions.',
		rules: `Split the deck evenly, face down. Both players flip their top card at once; the higher card takes both (aces high).
On a tie it's war: each player lays three cards face down and one face up, the higher face-up card takes the whole spread. Tie again? Repeat.
Run out of cards and you lose.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/War_(card_game)' }],
	},
	{
		name: 'Mao',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Trumf_bunke.JPG' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 3, playersMax: 8,
		playTimeMin: 15, playTimeMax: 60,
		tags: ['52-card', 'shedding', 'party', 'card-game'],
		description: 'Crazy Eights with secret rules: the only rule you may be told is that you may not be told the rules.',
		rules: `> [!WARNING]
> Reading this page violates the spirit of Mao. The game is traditionally learned by playing it badly and being penalized. Proceed if your table allows literacy.

## The public part

Plays like Crazy Eights: match the discard pile by **rank or suit**; can't play, draw one. First player out of cards wins, after correctly announcing **"Mao"** on their final card.

## The actual game

Every table has a body of **unspoken rules**, and violating any of them earns a penalty card, delivered with a stated reason and no further explanation (*"failure to say 'have a nice day'"*). Common ones:

- Certain ranks demand a phrase (7 → "have a nice day", each additional 7 escalates it)
- Aces skip, 8s reverse, spades must be named ("five of spades")
- Talking, touching cards out of turn, or asking about the rules: penalty
- Saying the word "Mao" mid-game: penalty

## The escalation

Each round's winner secretly **adds one new rule**. The rule set compounds until the table collapses into beautiful paranoia.

> [!NOTE]
> Rule sets vary wildly between groups, discovering your table's rules the hard way *is* the game.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mao_(card_game)' }],
	},
	{
		name: 'Cribbage',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Afternoon_cribbage_on_the_patio._%2850002851016%29.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2, playersMax: 4,
		playTimeMin: 30, playTimeMax: 45,
		tags: ['52-card', 'card-game'],
		description: 'The classic pegging race to 121: count fifteens, pairs, and runs.',
		rules: `## Setup

Each player is dealt six cards (five with 3-4 players) and discards two (one with 3-4) face down into the dealer's **crib**. Cut the deck to reveal the **starter** card, a jack scores the dealer 2 ("his heels").

## The play

- Alternate laying cards face up, announcing the running total; it may not pass **31**
- Score while playing: **15** = 2, **31** = 2, a pair = 2 (three of a kind = 6, four = 12), a run of 3+ in any order = run length
- Can't play without busting 31? Say "go", the last player to play scores 1 and the count resets

## The show

Count hands in order (non-dealer first, dealer's hand, then the crib), each combined with the starter:

| Combination | Points |
|---|---|
| Each combination totaling 15 | 2 |
| Each pair | 2 |
| Each run of 3+ | run length |
| Four-card flush (5 in the crib) | 4-5 |
| Jack matching the starter's suit ("his nobs") | 1 |

> [!NOTE]
> Peg to **121** to win. Order matters, dealer counts last, which decides close finishes.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Cribbage' }],
	},
	{
		name: 'Scum',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Mr._Presidente_card_game_%2824127660700%29.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 4, playersMax: 10,
		playTimeMin: 15, playTimeMax: 45,
		tags: ['52-card', 'shedding', 'climbing', 'party', 'card-game'],
		description: 'Shed your hand fastest to climb from Scum to King: the royal court version of President/Asshole.',
		rules: `## Play

Deal the whole deck. The lead plays a card or a set (pair, triple, etc.); each player in turn must play the **same number of cards of equal or higher rank**, or pass. When everyone passes, the pile clears and the last player to play leads fresh.

- 2s are highest (and in many houses clear the pile)
- First out is **King**, last out is the **Scum**

## The court

Finish order becomes rank for the next hand, **King, Queen**, court in the middle, **Vice-Scum**, and **Scum**, and everyone moves seats to match (the King gets the best chair; the Scum's chair is whatever's left).

Before each hand:

- The Scum gives the King their **two best cards**; the King returns any two they don't want
- The Vice-Scum and Queen trade one the same way
- The Scum deals, shuffles, and clears the table, that's the job

> [!NOTE]
> No fixed endpoint, play until the monarchy falls. Also known as President, Asshole, Capitalism, or Daifugō depending on whose house you're in; the royalty flavor is how it's played here.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/President_(card_game)' }],
	},
	{
		name: 'BS (Cheat)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Hand_of_cards.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 3, playersMax: 10,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'bluffing', 'shedding', 'party', 'card-game'],
		description: 'Discard face down, claim what you like, and call BS when you smell it.',
		rules: `## Play

Deal the whole deck. Ranks go in order around the table: the first player discards face down claiming aces ("two aces"), the next claims 2s, then 3s, and so on.

You **must play** on your turn, so sooner or later, you lie.

## Calling it

Anyone may call **"BS!"** before the next play. Flip the cards:

- Liar caught → they take the whole pile
- Claim was honest → the challenger takes the pile

> [!NOTE]
> First player to empty their hand (and survive the inevitable BS call on their last play) wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Cheat_(game)' }],
	},
	{
		name: 'Egyptian Ratscrew',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Pile_of_playing_cards.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 6,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'slap', 'speed', 'party', 'card-game'],
		description: 'War with violence: slap the pile on doubles and sandwiches before everyone else.',
		rules: `## Play

Deal the whole deck face down. In turn, flip your top card onto a center pile.

## Face-card challenges

Flip a face card or ace and the next player must pay: **ace = 4 chances, king = 3, queen = 2, jack = 1** flips to produce their own face card. Fail, and the challenger takes the pile. Succeed, and the challenge passes on.

## Slapping

Anyone, in or out of turn, may slap the pile and claim it on:

- **Double**, two of the same rank back to back
- **Sandwich**, same rank separated by one card
- (House rules add more: marriage (K+Q), top-bottom, runs of four...)

False slap = burn a card to the bottom of the pile. Out of cards? You can slap back in.

> [!NOTE]
> Collect the entire deck to win. Trim fingernails first.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Egyptian_Ratscrew' }],
	},
	{
		name: 'Spoons',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/7_playing_cards.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 3, playersMax: 13,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['52-card', 'party', 'speed', 'elimination', 'card-game'],
		description: 'Musical chairs with cards: make four of a kind and grab a spoon before they run out.',
		rules: `## Setup

Place **one fewer spoon than players** in the center. Everyone gets four cards; the dealer keeps the deck.

## Play

The dealer draws a card, keeps or passes it face down to the left; everyone simultaneously passes their discards along, always holding four cards. The last player discards to a trash pile.

## The grab

Make **four of a kind** and take a spoon, openly or by stealth. The moment anyone sees a spoon taken, they may grab too. Slowest player is left spoonless and eliminated (or takes a letter: S-P-O-O-N).

> [!NOTE]
> Last player standing wins. Casualties limited to furniture and friendships.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Spoons_(card_game)' }],
	},
	{
		name: 'Rummy 500',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Rummy_%28game%29-card_deal.JPG' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2, playersMax: 5,
		playTimeMin: 30, playTimeMax: 60,
		tags: ['52-card', 'melding', 'card-game'],
		description: 'Rummy where the whole discard pile is up for grabs: meld to 500.',
		rules: `## Play

Deal 7 cards each (13 for two players). On your turn: **draw, meld (optional), discard**.

The twist: the discard pile is face up and *spread out*, you may take **any card in it**, but you must take everything on top of it too, and immediately meld the card you dug for.

## Melds

Sets (3+ of a rank) and runs (3+ same suit in sequence), laid face up. You may also **lay off** cards onto anyone's melds, the points are yours.

## Scoring

When someone goes out, everyone scores melds *minus* cards left in hand:

| Cards | Points |
|---|---|
| Ace (melded high) | 15 |
| Face cards | 10 |
| Number cards | face value |
| Ace melded as A-2-3 | 5 |

> [!NOTE]
> First to **500** wins. Going negative is entirely possible and extremely funny.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/500_rum' }],
	},
	{
		name: 'Canasta',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/01/Canasta.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2, playersMax: 6,
		playTimeMin: 60, playTimeMax: 120,
		tags: ['52-card', 'melding', 'partnership', 'card-game'],
		description: 'The grand melding game: build canastas of seven with two decks and wild cards.',
		rules: `## Setup

Two decks plus four jokers (108 cards). Classic form is **four players in partnerships**; deal 11 each. Jokers and 2s are **wild**.

## Play

Draw (stock or the whole discard pile), meld, discard. Melds are 3+ cards of the same rank (wilds allowed, never majority); partners share melds.

- A meld of **seven** is a **canasta**: natural (no wilds, +500) or mixed (+300)
- The discard pile can be **frozen** (by a wild or red 3), then it takes a natural pair to pick it up
- Red 3s are automatic bonus cards (100 each, 800 for all four)
- Your first meld each hand must meet a minimum count that scales with your score

## Going out

You need at least one canasta to go out. Concealed hand (never melded until going out) doubles the bonus.

> [!NOTE]
> Card points: joker 50, ace/2 20, K-8 10, 7-4 and black 3s 5. First partnership to **5000** wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Canasta' }],
	},
	{
		name: 'Oh Hell',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Four_overlapping_playing_cards.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 3, playersMax: 7,
		playTimeMin: 30, playTimeMax: 60,
		tags: ['52-card', 'trick-taking', 'bidding', 'card-game'],
		description: 'Bid exactly how many tricks you\'ll take: no more, no less, or oh hell.',
		rules: `## Structure

Hand sizes step down then back up: deal 7 (or 10) cards, then 6, 5... down to 1, and back to the top. Flip a card for trump each hand.

## Bidding

In turn, everyone bids exactly how many tricks they'll take. The dealer bids last and **may not bid the number that makes total bids equal total tricks**, someone must fail every hand (the "screw the dealer" rule).

## Play

Standard trick-taking: follow suit if able; highest of the led suit wins unless trumped.

## Scoring

- Make your bid **exactly**: 10 + the bid (zero bids score 10)
- Miss in either direction: nothing (or -1 per trick off, by house rule)

> [!NOTE]
> Highest total after the full up-and-down cycle wins. The 1-card hand is pure comedy.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Oh_hell' }],
	},
	{
		name: 'Pitch (Setback)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Four_overlapping_playing_cards.jpg' },
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2, playersMax: 7,
		playTimeMin: 30, playTimeMax: 45,
		tags: ['52-card', 'trick-taking', 'bidding', 'card-game'],
		description: 'Fast bidding trick-taker: chase High, Low, Jack, and Game.',
		rules: `## Deal & bid

Six cards each. Bid **2, 3, or 4** (or "smudge"/shoot for all four points in some houses) for the right to name trump, highest bidder "pitches" the first card, and its suit is trump.

## The four points

| Point | Goes to |
|---|---|
| **High** | whoever is dealt the highest trump in play |
| **Low** | whoever *wins* the lowest trump in play (house-varies: dealt vs won) |
| **Jack** | whoever wins the trick containing the jack of trump (if out) |
| **Game** | most card points in tricks (10=10, A=4, K=3, Q=2, J=1) |

## Scoring

Make your bid: score every point you took. Fall short: you're **set back** the full bid (negative scores routine).

> [!NOTE]
> First to **11** (or 21) wins; the bidder's points count first when both cross the line.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Pitch_(card_game)' }],
	},
	{
		name: 'Golf (card game)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Golf_card_game.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 6,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'card-game'],
		description: 'Four cards face down, swap toward the lowest score: nine holes, golf rules.',
		rules: `## Setup (4-card version)

Each player lays four cards face down in a 2x2 grid and peeks at the **bottom two** once. The rest is stock; flip one to start the discard.

## Play

On your turn, draw from stock or discard, then either swap it for any grid card (discarding the replaced card, face up) or discard it. Face-down cards stay secret until swapped or the round ends.

## Scoring

When someone **knocks** (all their cards face up), everyone else gets one last turn, then flip and count:

| Card | Value |
|---|---|
| Ace | 1 |
| 2 | -2 |
| 3-10 | face value |
| J/Q | 10 |
| K | 0 |
| Pair in a column | cancels to 0 |

> [!NOTE]
> Nine rounds ("holes"). Lowest total wins. The 6-card version plays the same with a 2x3 grid and column-matching.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Golf_(card_game)' }],
	},
	{
		name: 'Thirty-One (Scat)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Winning_hand_in_the_game_of_Thirty-One.png' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 9,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'push-your-luck', 'card-game'],
		description: 'Draw and discard toward 31 in one suit: knock when you dare.',
		rules: `## Play

Three cards each, three lives (chips) each. On your turn draw from stock or discard, then discard, chasing the highest total **in a single suit**:

- Aces = 11, faces = 10, numbers = face value
- Three of a kind = 30.5 in most houses
- **31 exactly** ("scat"), reveal instantly, everyone else loses a life

## Knocking

Instead of drawing, **knock**: everyone else gets one final turn, then hands show. Lowest hand loses a life, and if the knocker is lowest (or tied), *they* lose one (or two, house rules).

> [!NOTE]
> Out of lives, you're out ("riding the bus" on your last). Last player alive wins.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Thirty-one_(card_game)' }],
	},
	{
		name: 'Kings in the Corner',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Kings_in_the_Corner_card_game.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 4,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'card-game'],
		description: 'Multiplayer solitaire: build down in alternating colors, kings claim the corners.',
		rules: `## Setup

Deal 7 cards each. Flip four cards as a cross around the stock, north, south, east, west.

## Play

On your turn, draw one card, then play as many moves as you can:

- Play cards from your hand onto the layout piles, **descending and alternating color** (red 9 on black 10)
- **Kings** go in the empty diagonal corners, starting new piles
- Move whole piles onto other piles when the sequence fits
- Fill an emptied cross spot with any card

Your turn ends when you say so (or you go out).

> [!NOTE]
> First to play their whole hand wins. Score losers' remaining cards (10 per king, 1 per other) if playing for points.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Kings_in_the_Corner' }],
	},
	{
		name: 'Palace (Shithead)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Hand_in_Shithead.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 5,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'shedding', 'party', 'card-game'],
		description: 'The backpacker classic: burn through your hand, your face-ups, then your blind cards.',
		rules: `## Setup

Each player gets a row of **three face-down** cards, **three face-up** on top of them, and a hand of three. Before starting you may swap hand cards with your face-ups.

## Play

Play a card (or set) **equal or higher** than the pile top, then draw back to three while stock lasts. Can't play? **Pick up the whole pile.**

Magic cards (the common set, houses vary):

- **2**, resets the pile, play anything next
- **10**, burns the pile out of the game; same player goes again
- Four of a rank on top, also burns
- **7**, next player must play *lower* than 7 (house rule)

## The endgame

Hand empty and stock gone: play your **face-ups**, then your **face-downs blind**, flip and pray; a miss picks up the pile.

> [!NOTE]
> First player out escapes. Last player is the Shithead and shuffles next round. That's the entire point of the game.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Shithead_(card_game)' }],
	},
	{
		name: 'Spit (Speed)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Deuces_to_Seven.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 2,
		playTimeMin: 5, playTimeMax: 15,
		tags: ['52-card', 'speed', 'card-game'],
		description: 'Two players, zero turns: slam cards onto the center piles as fast as your hands allow.',
		rules: `## Setup

Split the deck. Each player lays five solitaire-style stock piles (1-2-3-4-5, tops face up) and keeps the rest as their **spit pile**.

## Play, simultaneous, no turns

Both players flip a spit card to the center at once, then race to play from their stock piles onto either center pile, **one rank up or down** (ace wraps). Expose and flip freed stock cards as you go; keep at most five piles.

Both stuck? Spit again, flip new center cards simultaneously.

## The slap

When a player empties their stock piles, both **slap the center pile they want**, you want the *smaller* one. Take it plus your leftovers, re-deal, go again.

> [!NOTE]
> Win the game by getting rid of **all** your cards, end a round with no spit pile left. The *Speed* variant plays the same race with 5-card hands and replacement piles.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Spit_(card_game)' }],
	},
	{
		name: 'Nertz',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Nertz_players_%28149101448%29.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 6,
		playTimeMin: 15, playTimeMax: 30,
		tags: ['52-card', 'speed', 'party', 'card-game'],
		description: 'Competitive simultaneous solitaire: everyone plays to shared aces at full speed.',
		rules: `## Setup

**Each player needs their own deck** (distinguishable backs). Everyone deals a 13-card **Nertz pile** (top face up), four work piles, and holds the rest as stock.

## Play, everyone at once

- Build your four work piles down in alternating colors, solitaire-style
- Flip your stock three at a time
- Aces go to the shared center; **anyone may play onto any center pile**, up in suit, first card there wins the spot
- Feed cards from your Nertz pile into your work piles whenever possible

## Scoring

Someone empties their Nertz pile and calls **"Nertz!"**, round over:

- +1 per card you got onto the center piles (count your card backs)
- **-2 per card left in your Nertz pile**

> [!NOTE]
> First to **100** wins. Basically legalized chaos; also sold boxed as *Dutch Blitz*.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Nertz' }],
	},
	{
		name: 'Blackjack',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/BlackJackGame.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 7,
		playTimeMin: 10, playTimeMax: 60,
		tags: ['52-card', 'push-your-luck', 'gambling', 'card-game'],
		description: 'Twenty-one: beat the dealer without busting.',
		rules: `## Play

Everyone bets, then gets two cards; the dealer takes one up, one down. In turn, each player:

- **Hit**, take a card (repeat at will)
- **Stand**, lock your total
- **Double down**, double the bet, take exactly one card
- **Split**, matching pair becomes two hands (second bet required)

Go over 21 and you **bust**, bet lost immediately.

## Values

Faces = 10, ace = 1 or 11 (whichever helps), numbers = face value. Ace + ten-card on the deal is a **blackjack**, pays 3:2.

## The dealer

Plays last by fixed rules: hits to 16, stands on 17 (house varies on soft 17). Dealer busts, all survivors win; otherwise higher total takes it, ties push.

> [!NOTE]
> Home game: rotate the deal, or bank it and learn why casinos exist.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Blackjack' }],
	},
	{
		name: 'Assassin',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 6, playersMax: 50,
		tags: ['live-action', 'large-group', 'no-equipment', 'elimination'],
		description: 'The live-action elimination game: everyone has a secret target, played out over days or weeks of real life.',
		rules: `## Setup

A moderator collects every player's name and deals out **targets in a single secret loop**, you know only your own target; someone unknown is hunting you.

## Eliminations

Agree on the weapon and rules before starting. Classics:

- **Clothespin** planted on the target without them noticing
- **Spoon touch**, tag them with a spoon (they're safe while holding their own, by house rule)
- **Sock/water** variants for outdoor seasons
- Witnesses void the kill in most rule sets, assassinations must be *clean*

When you eliminate your target, you inherit **their target** and the loop tightens.

## Safe zones & honor

Agree up front: work/class, bathrooms, cars in motion, and holding-your-totem are the usual sanctuaries. The game runs on the honor system, the dead report their own deaths to the moderator.

> [!NOTE]
> Last assassin alive wins. Runs days to weeks alongside normal life, the paranoia is the content. Also known as Gotcha, Killer, or Circle of Death.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Assassin_(game)' }],
	},
	{
		name: 'Mafia',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Playing_mafia_game.jpg' },
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 7, playersMax: 20,
		playTimeMin: 20, playTimeMax: 60,
		tags: ['social-deduction', 'no-equipment', 'elimination', 'hidden-roles', 'large-group'],
		description: 'The parlor original behind Werewolf: the village sleeps, the mafia doesn\'t.',
		rules: `## Setup

A moderator secretly assigns roles, **2-4 Mafia**, everyone else **Town** (plus optionals: a **Detective** who checks one player per night, a **Doctor** who saves one). Deal cards or whisper assignments.

## Night

Everyone closes their eyes. The moderator wakes the Mafia to silently pick a victim, then the special roles for their actions.

## Day

The moderator narrates the death (embellishment is the job). The town debates and **votes to lynch** a suspect, plurality rules, ties by runoff or moderator's whim. The lynched player reveals nothing (or their role, house choice) and is out.

Repeat until one side wins.

> [!NOTE]
> **Town wins** when all Mafia are eliminated; **Mafia wins** at parity. Needs zero equipment and one theatrical moderator. Werewolf is this game wearing a costume.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mafia_(party_game)' }],
	},
	{
		name: 'Wink Murder',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 6, playersMax: 20,
		playTimeMin: 5, playTimeMax: 15,
		tags: ['social-deduction', 'no-equipment', 'elimination', 'hidden-roles'],
		description: 'One killer, one wink at a time: catch the murderer before everyone\'s dead.',
		rules: `## Setup

Assign the murderer secretly, dealt cards (the ace kills) or a moderator picks while everyone's eyes are closed. Optionally one player is the **detective** and knows nothing.

## Play

Everyone mingles or sits in a circle making eye contact. The murderer kills by **winking** at a victim, who waits a few dramatic seconds and then *dies theatrically* (this is mandatory and the point).

Anyone may accuse, usually requiring a second accuser. Wrong accusation: the accusers are dead. Right: game over.

> [!NOTE]
> Murderer wins by killing everyone but one; the group wins by catching them. *Murder in the Dark* is the lights-off hallway variant for people who trust their friends too much.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Wink_murder' }],
	},
	{
		name: 'Celebrity (Fishbowl)',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 4, playersMax: 20,
		playTimeMin: 30, playTimeMax: 60,
		tags: ['party', 'no-equipment', 'teams', 'guessing', 'paper-and-pen'],
		description: 'Three rounds, one shrinking bowl of names: describe, one-word, then act.',
		rules: `## Setup

Everyone writes **3-5 names** (celebrities, characters, mutual friends) on paper slips into a bowl. Split into two teams.

## Three rounds, same names every round

Teams alternate 60-second turns; the clue-giver pulls slips and their team guesses. Score a point per slip; re-bowl everything between rounds.

1. **Describe**, say anything except the name
2. **One word**, a single word per slip (everyone knows the names now; that's the design)
3. **Charades**, act it out, silence only

*(Popular fourth round: **sound effects only**, or **facial expressions only**, for tables that hate themselves.)*

> [!NOTE]
> Most slips after three rounds wins. Boxed as *Monikers*; also called Salad Bowl, Fishbowl, or The Hat. The memory game across rounds is what makes it the best party game that costs nothing.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Celebrity_(game)' }],
	},
	{
		name: 'Charades',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Game_of_Charades_-_01.jpg' },
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 4, playersMax: 20,
		playTimeMin: 20, playTimeMax: 60,
		tags: ['party', 'no-equipment', 'teams', 'guessing'],
		description: 'The original acting game: no words, no sounds, all flailing.',
		rules: `## Play

Teams take turns: one member silently acts out a phrase (movie, book, song, show...) while their team guesses against a timer (2-3 minutes).

## The standard signals

| Gesture | Meaning |
|---|---|
| Cranking a projector | movie |
| Open palms like a book | book |
| Air quotes | quote/phrase |
| Fingers held up | number of words / which word |
| Fingers on forearm | syllables |
| Tug earlobe | "sounds like" |
| Hands pulling apart / squeezing | longer / shorter word |

> [!NOTE]
> Score a point per solved phrase; play to a target or until dessert. Opponents write the prompts for maximum cruelty.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Charades' }],
	},
	{
		name: 'Two Truths and a Lie',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 3, playersMax: 20,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['party', 'no-equipment', 'bluffing'],
		description: 'Three claims, one fabrication: the icebreaker that outs everyone\'s weirdest story.',
		rules: `## Play

In turn, each player states **three things about themselves**, two true, one invented. The group interrogates (or just votes) and each player guesses which was the lie.

- Point to every player who guesses right
- Point to the storyteller for every player fooled

> [!NOTE]
> The meta: your truths should sound fake and your lie boring. The game is a machine for discovering your friend once bit a police horse.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Two_Truths_and_a_Lie' }],
	},
	{
		name: 'Never Have I Ever',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 4, playersMax: 20,
		playTimeMin: 15, playTimeMax: 60,
		tags: ['party', 'no-equipment', 'adult'],
		description: 'Confess by counting fingers: the disclosure engine of every college dorm.',
		rules: `## Play

Everyone holds up **ten fingers**. In turn, each player states something they have *never* done ("Never have I ever been in a police car"). Everyone who **has** done it drops a finger, and, by sacred tradition, tells the story.

- First to zero fingers "loses" (wins?)
- Drinking variant: sip instead of (or in addition to) fingers

> [!NOTE]
> Strategy exists: target statements at specific players. That's not against the rules; it *is* the rules.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Never_Have_I_Ever' }],
	},
	{
		name: 'Contact',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 3, playersMax: 10,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['party', 'no-equipment', 'words', 'car-game', 'guessing'],
		description: 'Team up against the word-keeper: make contact on shared clues to force out letters.',
		rules: `## Play

One player (the **keeper**) thinks of a word and reveals its **first letter**. Everyone else tries to crack it.

1. A challenger thinks of a word starting with the revealed letters and gives an oblique clue ("something you'd find in a kitchen...")
2. Another challenger who thinks they know the clue-word shouts **"Contact!"**, both count down and say their word simultaneously
3. Words match → the keeper must reveal the **next letter** of the secret word... *unless* the keeper preempts by guessing the clue-word first ("it's not *spatula*")

Guess the full secret word outright (as part of a contact) to win.

> [!NOTE]
> The keeper is playing defense against inside jokes and shared context, which is why it's unwinnable against siblings. Premier road-trip material.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Contact_(word_game)' }],
	},
	{
		name: 'Psychiatrist',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 5, playersMax: 15,
		playTimeMin: 15, playTimeMax: 40,
		tags: ['party', 'no-equipment', 'guessing'],
		description: 'One player left the room; everyone else adopted a shared psychosis. Diagnose it.',
		rules: `## Play

The **psychiatrist** leaves the room. The group agrees on a *condition*, a hidden rule governing how they'll answer questions. Classics:

- Everyone answers as the person to their left
- Everyone is the psychiatrist
- Answers must contain a color / start with the next letter of the alphabet
- Everyone believes they're in a submarine

The psychiatrist returns and asks anyone anything, working out the condition. Wrong-but-revealing answers are the comedy engine. If someone breaks the rule, the group shouts **"Psychiatrist!"** and everyone shuffles seats.

> [!NOTE]
> The psychiatrist wins by diagnosing the condition; then someone else takes the couch. Choose conditions the group can actually sustain, recursion is funnier in theory than in practice.`,
		links: [],
	},
	{
		name: '20 Questions',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 5, playTimeMax: 20,
		tags: ['no-equipment', 'deduction', 'car-game'],
		description: 'Animal, vegetable, or mineral: binary-search a secret in twenty yes/no questions.',
		rules: `## Play

One player thinks of something. Everyone else asks **yes/no questions**, twenty total between them, then must guess.

- Traditional opener: "Animal, vegetable, or mineral?"
- The answerer must be honest; "sort of" and "irrelevant" are legal answers
- Guesses count as questions

> [!NOTE]
> Guessed right within twenty → askers win; the guesser becomes the next answerer. Twenty well-chosen binary questions can distinguish over a million things, the game is applied information theory with car-ride pacing.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Twenty_questions' }],
	},
	{
		name: 'Who Am I? (Forehead Game)',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 3, playersMax: 15,
		playTimeMin: 15, playTimeMax: 40,
		tags: ['party', 'guessing', 'paper-and-pen'],
		description: 'A name on your forehead everyone can read but you: question your way to your own identity.',
		rules: `## Play

Everyone writes a famous name on a sticky note and plants it on their **neighbor's forehead**, unseen. In turn (or all at once, mingling-style), players ask **yes/no questions** about themselves:

- "Am I alive?" "Am I fictional?" "Have I committed crimes?"
- A **no** ends your turn; a **yes** lets you keep asking
- Guessing your name right gets the note off your head

> [!NOTE]
> Last forehead labeled loses. Boxed variants exist (*Hedbanz*, the *Heads Up!* app) but a pad of sticky notes is the whole kit.`,
		links: [],
	},
	{
		name: 'Truth or Dare',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 3, playersMax: 15,
		playTimeMin: 20, playTimeMax: 90,
		tags: ['party', 'no-equipment', 'adult'],
		description: 'The ancient rite: answer honestly or do the thing.',
		rules: `## Play

In turn (or spin a bottle to pick), ask a player: **"Truth or dare?"**

- **Truth**, they must answer your question honestly
- **Dare**, they must do the thing (within the group's pre-agreed bounds)

Refusal costs a forfeit the group decides on. Then it's their turn to ask.

> [!NOTE]
> The whole game is calibration: know your room, set boundaries up front, and remember everything said is remembered forever. There is no winning, only surviving.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Truth_or_dare%3F' }],
	},
	{
		name: 'Would You Rather',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 2, playersMax: 20,
		playTimeMin: 10, playTimeMax: 60,
		tags: ['party', 'no-equipment', 'car-game'],
		description: 'Two terrible options, one mandatory choice: the debate is the game.',
		rules: `## Play

In turn, pose a dilemma: *"Would you rather fight one horse-sized duck or a hundred duck-sized horses?"*

- Everyone must choose, "neither" is illegal
- Everyone must defend their choice; the argument is the content
- Optional scoring: the asker guesses the majority split, point if right

> [!NOTE]
> Good dilemmas are balanced (a genuinely hard call) or revealing (the answer says something). Bad dilemmas have a right answer. The duck question remains undefeated.`,
		links: [],
	},
	{
		name: 'Paper Telephone (Eat Poop You Cat)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Telestrations_party_game_of_drawing_and_guessing_02.jpg/3840px-Telestrations_party_game_of_drawing_and_guessing_02.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 4, playersMax: 12,
		playTimeMin: 20, playTimeMax: 45,
		tags: ['party', 'paper-and-pen', 'drawing', 'humor'],
		description: 'Telephone played through alternating sentences and drawings: degradation guaranteed.',
		rules: `## Play

Everyone writes a sentence at the top of a paper, then passes it. Each pass alternates:

1. Read the sentence, **draw it**, fold the sentence out of view, pass
2. See only the drawing, **caption it** with a sentence, fold the drawing away, pass
3. Repeat until the papers come home

Then read every chain aloud, in order. "A dog buries a bone" arrives home as "the mayor is eaten by regret."

> [!NOTE]
> No points, the readings are the payoff. Boxed as *Telestrations* with dry-erase spiral pads; scrap paper works exactly as well. The traditional name comes from a legendary first-ever starting sentence.`,
		links: [{ label: 'Telestrations (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Telestrations' }],
	},
	{
		name: 'Exquisite Corpse',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Exquisite_corpse_drawing_by_Noah_Ryan_and_Erica_Parrott.JPG' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 3, playersMax: 8,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['paper-and-pen', 'drawing', 'co-op'],
		description: 'The surrealist fold-and-draw monster factory: head, torso, legs, nobody sees the whole until the reveal.',
		rules: `## Play

Fold a paper into **three sections** (or one per player). Each player draws one section of a figure without seeing the others:

1. First player draws the **head and neck**, extending the neck lines *just past the fold*, then folds their section back so only the guide lines show
2. Next draws the **torso and arms** from those guide lines, folds, extends hip lines past the crease
3. Last draws the **legs and feet**

Unfold. Behold the abomination. Name it, naming is mandatory.

## The written variant

The original 1920s Paris parlor version was words: each player writes a sentence fragment (adjective-noun-verb-adjective-noun) unseen. The first ever result: *"The exquisite corpse shall drink the new wine"*, hence the name.

> [!NOTE]
> Invented by the Surrealists (Breton, Éluard, and company) as a serious artistic method. Still their best game. No winners, only monsters.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Exquisite_corpse' }],
	},
	{
		name: 'Consequences',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 3, playersMax: 10,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['paper-and-pen'],
		description: 'The Victorian fold-and-write story game: Exquisite Corpse for sentences.',
		rules: `## Play

Everyone writes one element of a story on their paper, folds it hidden, and passes. The classic sequence:

1. An adjective +  a man's name
2. "met" + an adjective + a woman's name
3. Where they met
4. What he said to her
5. What she said to him
6. What he did
7. What she did
8. **The consequence** (what happened as a result)
9. What the world said

Unfold and read the completed stories aloud, straight-faced if possible.

> [!NOTE]
> The written ancestor of Exquisite Corpse and Mad Libs. Adjust the template freely, the fixed grammar is what makes the collisions land.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Consequences_(game)' }],
	},
	{
		name: 'Hangman',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Hangman_example.svg/960px-Hangman_example.svg.png' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 8,
		playTimeMin: 5, playTimeMax: 15,
		tags: ['paper-and-pen', 'words', 'kids'],
		description: 'Guess the word letter by letter before the stick figure completes.',
		rules: `## Play

One player thinks of a word and draws a blank per letter. The others guess **letters**:

- Correct → fill in every occurrence
- Wrong → draw the next piece of the gallows figure (head, body, two arms, two legs, six misses in the standard build)

Solve the word before the figure completes, or the word-keeper wins.

> [!NOTE]
> Keeper strategy: short words with rare letters beat long words (JAZZ ruins lives). Guessers: E-T-A-O-I-N first, then common digraphs. House-rule whether whole-word guesses cost a limb when wrong.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Hangman_(game)' }],
	},
	{
		name: 'Dots and Boxes',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Dotsandlines.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 4,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['paper-and-pen'],
		description: 'Connect dots, claim boxes: the deceptively deep grid game.',
		rules: `## Play

Draw a grid of dots (5x5 to start). Players alternate drawing **one line** between adjacent dots (no diagonals).

- Complete the fourth side of a box → write your initial in it **and move again**
- Chains of completed boxes can cascade an entire turn

Most boxes when the grid fills wins.

## The actual game

Beginners give away the first box and lose everything. The real strategy is **chain control**: count the chains forming, and sacrifice small chains early (the *double-cross*, leave the last two boxes of a chain) to force your opponent to open the big ones.

> [!NOTE]
> Solved-ish at small sizes but genuinely deep at 6x6+; there are books about it. The best pen-and-paper game per square inch.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Dots_and_boxes' }],
	},
	{
		name: 'MASH',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 6,
		playTimeMin: 10, playTimeMax: 20,
		tags: ['paper-and-pen', 'kids'],
		description: 'Mansion, Apartment, Shack, House: the sleepover fortune-teller.',
		rules: `## Play

Write **MASH** across the top (Mansion, Apartment, Shack, House). Below it, make categories with ~4 options each, the subject picks some, friends add the terrible ones:

- Who you'll marry
- Career, salary
- Car, city
- Number of kids

## The count

Draw a spiral until the subject says stop; count its rings, that's the **magic number**. Count through all options repeatedly, crossing off every Nth; when a category has one survivor, it's locked in.

Read out the completed fortune: *"You'll live in a Shack in Paris with your archnemesis, driving a shopping cart, with eleven kids."*

> [!NOTE]
> The friends' job is loading the option lists. That is the whole game and it has powered sleepovers since the 1970s.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/MASH_(game)' }],
	},
	{
		name: 'Tic-Tac-Toe',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Tic_tac_toe.svg/960px-Tic_tac_toe.svg.png' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 2,
		playTimeMin: 1, playTimeMax: 5,
		tags: ['paper-and-pen', 'kids'],
		description: 'X\'s and O\'s: three in a row on the eternal 3x3.',
		rules: `## Play

Alternate marking Xs and Os on a 3x3 grid. Three in a row (any direction) wins; a full grid with no line is the cat's game.

## The truth

Solved: perfect play from both sides **always draws**. Corners are the strongest opening; center is the strongest reply. If your opponent opens corner and you take an edge, you have already lost.

> [!NOTE]
> Graduate to **Ultimate Tic-Tac-Toe** when ready: a 3x3 of 3x3 boards, where your move's position dictates which sub-board your opponent plays in next. That one is a real game.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Tic-tac-toe' }],
	},
	{
		name: 'Sprouts',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 2,
		playTimeMin: 5, playTimeMax: 20,
		tags: ['paper-and-pen', 'topology', 'math'],
		description: 'The topological doodle game from Cambridge mathematicians: curves, spots, and death by degree.',
		rules: `## Play

Start with a few **spots** (2-4). Players alternate:

1. Draw a **curve** connecting two spots (or a spot to itself), curves may not cross anything
2. Place a **new spot** on the curve just drawn

The constraint that kills: **no spot may ever have more than three lines** touching it.

Last player able to move wins.

> [!NOTE]
> Invented by Conway and Paterson at Cambridge, 1967. An *n*-spot game lasts at most 3n-1 moves; who wins with perfect play is only known up to modest sizes, it's a real research object you can play on a napkin.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Sprouts_(game)' }],
	},
	{
		name: 'SOS',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 4,
		playTimeMin: 5, playTimeMax: 20,
		tags: ['paper-and-pen'],
		description: 'Tic-tac-toe\'s bigger meaner cousin: spell SOS in a grid, extra turn per score.',
		rules: `## Play

On a grid (5x5 casual, bigger for blood matches), players alternate writing **either an S or an O** in any empty cell, your choice each turn, no fixed letter per player.

- Complete **S-O-S** in a line (any direction) → circle it in your color, score 1, **move again**
- One move can complete multiple SOSes

Most SOSes when the grid fills wins.

> [!NOTE]
> Because both players can write both letters, every placement is double-edged, the O you need is the O they'll use. Plays like dots-and-boxes' chain logic wearing a word costume.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/SOS_(game)' }],
	},
	{
		name: 'Categories (Guggenheim)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Example_Categories_game.png' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 15, playTimeMax: 40,
		tags: ['paper-and-pen', 'words'],
		description: 'Pick a letter, fill every category: the pen-and-paper ancestor of Scattergories.',
		rules: `## Play

Everyone draws the same grid: **categories** down the side (animals, cities, foods, movie titles, things in a garage...), and a chosen **letter** (or a word spelled across columns, Guggenheim-style) on top.

On "go", fill every cell with an answer starting with that letter, 2-3 minute timer.

## Scoring

Read answers aloud:

- Valid and **unique** (nobody else wrote it) → 2 points
- Valid but duplicated → 1 (or 0, house rules)
- Blank or challenged-off → 0

> [!NOTE]
> The boxed version is Scattergories (with the 20-sided letter die); the paper version predates it by a century and needs nothing. Obscure-but-defensible answers are the skill ceiling, "axolotl" wins games.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Categories_(game)' }],
	},
	{
		name: 'Bulls and Cows (Jotto)',
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 2,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['paper-and-pen', 'deduction', 'code-breaking', 'words'],
		description: 'The paper code-breaker that became Mastermind and Wordle.',
		rules: `## Play (digits version)

Each player writes a secret **4-digit number, no repeated digits**. Alternate guessing each other's number; the answer to every guess is scored:

- **Bull**, right digit, right position
- **Cow**, right digit, wrong position

"Two bulls, one cow", deduce from there. First to four bulls wins.

## Jotto (the word version)

Same game with secret **5-letter words**; answers give only the count of shared letters (position-blind in classic Jotto). Yes, this is Wordle's grandfather, Wordle just made the computer the keeper.

> [!NOTE]
> Mastermind boxed this exact deduction loop with colored pegs in 1970. Paper needs nothing and the deduction is identical.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bulls_and_cows' }],
	},
	{
		name: 'Ghost (word game)',
		setting: 'Anywhere',
		complexity: 'Light',
		playersMin: 2, playersMax: 8,
		playTimeMin: 5, playTimeMax: 20,
		tags: ['no-equipment', 'words', 'car-game', 'elimination'],
		description: 'Spell toward a word without ever finishing one: complete a word and take a letter of GHOST.',
		rules: `## Play

Players take turns adding **one letter** to a growing fragment. Two rules bind every addition:

1. The fragment must remain the start of *some* real word (minimum 4 letters to count)
2. If your letter **completes a word**, you lose the round

Think someone's bluffing (their fragment can't become anything)? **Challenge**, they name their word or take the loss; a successful defense sinks the challenger.

Round losers collect letters: G, H, O, S, T. Spell GHOST and you're out.

> [!NOTE]
> The deep play is forcing parity, steering the fragment so the word *must* land on your opponent. *Superghost* (add to either end) is the black-belt version.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ghost_(word_game)' }],
	},
	{
		name: 'Ship, Captain & Crew',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Dice_-_1-2-4-5-6.jpg/3840px-Dice_-_1-2-4-5-6.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['push-your-luck', 'dice-game'],
		description: 'Qualify your ship, captain, and crew in order: then the last two dice are your cargo.',
		rules: `## Play

Five dice, **three rolls** per turn. You must bank, in strict order:

1. **Ship**, a 6
2. **Captain**, a 5 (only after the 6)
3. **Crew**, a 4 (only after the 5)

Roll a 6 and a 4 with no 5? The 4 doesn't count yet, that's the game.

## Cargo

Once ship/captain/crew are set aside, the remaining **two dice are your cargo** (2-12). Rolls left over may be spent re-rolling the cargo for a better score, or keep it and stop.

Fail to qualify all three in three rolls → score zero.

> [!NOTE]
> Highest cargo in the round takes the pot/point; ties re-roll. Also called 6-5-4. The agony of rolling 6-4-4-3-2 twice in a row is the authentic bar experience.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ship,_captain,_and_crew' }],
	},
	{
		name: 'Cee-lo',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Horne_dice_d6.JPG' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['gambling', 'dice-game'],
		description: 'Three dice against the wall: 4-5-6 wins everything, 1-2-3 loses everything.',
		rules: `## Rolls

Shake three dice and roll until you hit a scoring combination:

| Roll | Result |
|---|---|
| **4-5-6** | instant win ("cee-lo") |
| **Triples** | wins; higher triples beat lower |
| **Pair + odd die** | the odd die is your **point** (1-6) |
| **1-2-3** | instant loss |

Anything else (no pair, no sequence), roll again.

## Banked or head-to-head

- **Banker version**: the bank covers all bets; a banker's 4-5-6/triple/high point sweeps, players then roll to beat the banker's point
- **Open version**: everyone antes, everyone rolls, highest result takes the pot

> [!NOTE]
> Play with matchsticks or quarters unless you mean it. Rolling against a wall is traditional and keeps everyone honest.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Cee-lo' }],
	},
	{
		name: 'Threes',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Dice_on_the_table_six_and_five.jpg/3840px-Dice_on_the_table_six_and_five.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 5, playTimeMax: 15,
		tags: ['dice-game'],
		description: 'Five dice, lowest total wins: and threes count as zero.',
		rules: `## Play

Roll five dice. You must **keep at least one die** each roll, then re-roll the rest, until all five are kept.

- **3s count as zero**, they're the whole game
- Everything else counts face value
- Lowest total wins the round (perfect score: five 3s = 0)

> [!NOTE]
> The tension is banking a 1 or 2 now versus fishing for 3s with fewer dice later. Plays in ninety seconds; ante a quarter a round and it plays all night. Also called Tripps or Low Roll.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Threes_(dice_game)' }],
	},
	{
		name: 'Mexico (Mäxchen)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/160327_White_dice_08.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 10,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['bluffing', 'dice-game'],
		description: 'Two dice under a cup, and every roll is announced: truthfully or not. 21 rules all.',
		rules: `## Reading the dice

Roll two dice under a cup; only you may look. The higher die is the tens digit: 5 and 3 = **53**. Ranking, low to high:

1. Plain numbers (31, 32, ... 65)
2. **Doubles** (11 through 66) beat all plain numbers
3. **21, "Mexico/Mäxchen"**, beats everything

## The bluff

Each announced roll must be **higher than the previous announcement**. You may lie. The next player either:

- **Believes**, takes the cup and must roll (and announce) higher still
- **Calls it**, lift the cup: liar caught loses a life/drinks; honest roll means the challenger loses

Announcing Mexico forces the next player to call or roll a Mexico of their own.

> [!NOTE]
> Liar's Dice compressed to two dice and one lie at a time. Known as Mäxchen, Meiern, or Mia depending on the border. Lives (usually 3-6) or drinks, house's choice.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Mia_(game)' }],
	},
	{
		name: 'Craps (street)',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Marines_and_sailors_attended_5th_annual_Casino_Royale_event_130928-M-WI309-003.jpg/3840px-Marines_and_sailors_attended_5th_annual_Casino_Royale_event_130928-M-WI309-003.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 12,
		playTimeMin: 10, playTimeMax: 60,
		tags: ['gambling', 'dice-game'],
		description: 'Two dice and a wall: the come-out roll, the point, and everything riding on seven.',
		rules: `## The come-out roll

The shooter antes, others **fade** (match) the bet, then the shooter rolls two dice:

| Come-out | Result |
|---|---|
| **7 or 11** | natural, shooter wins the pot |
| **2, 3, or 12** | craps, shooter loses |
| **4, 5, 6, 8, 9, 10** | that number becomes the **point** |

## The point

The shooter keeps rolling:

- Hit the **point again** → shooter wins
- Roll a **7 first** → seven-out, shooter loses and the dice pass left

Side bets on every roll are the street tradition, anyone can bet anyone on anything the dice might do next.

> [!NOTE]
> Bounce both dice off the wall or the roll doesn't count. The casino table adds felt, chips, and worse odds, the game itself is exactly this.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Craps' }],
	},
	{
		name: 'Bunco',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Three_six-sided_dice.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 8, playersMax: 16,
		playTimeMin: 60, playTimeMax: 120,
		tags: ['large-group', 'party', 'dice-game'],
		description: 'The big-table social dice night: roll for the round number, yell BUNCO, rotate tables.',
		rules: `## Setup

Twelve is the canonical count: **three tables of four**, partners across. Each table gets three dice; the head table gets the bell. Score sheets and a fuzzy die to pass around optional but traditional.

## Rounds

Round number = target number (round 1 chases 1s, round 2 chases 2s...). On your turn, roll all three dice:

- Each die matching the target = **1 point**, keep rolling
- **All three match the target = BUNCO**, 21 points, yell it
- Three of a kind of the *wrong* number = 5 points
- No matches → dice pass left

Head table rings the bell at 21 points to end the round. Winners move up a table, losers of the head table go to the bottom; partners reshuffle.

> [!NOTE]
> Score wins, buncos, and losses across all six rounds (or four sets of six), prizes for most wins, most buncos, most losses. Zero skill by design: the game is a social scheduling device, and it's been one since 1855.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Bunco' }],
	},
	{
		name: 'Poker Dice',
		imageSource: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Dice%2C_game_%28AM_2015.20.16-2%29_%28cropped%29.jpg/3840px-Dice%2C_game_%28AM_2015.20.16-2%29_%28cropped%29.jpg' },
		setting: 'Table',
		complexity: 'Light',
		playersMin: 2, playersMax: 8,
		playTimeMin: 10, playTimeMax: 30,
		tags: ['poker', 'gambling', 'dice-game'],
		description: 'Five dice, poker hands, one re-roll: poker with all the cards removed.',
		rules: `## Play

Roll five dice; up to **two re-rolls**, keeping any dice between (announce how many you're re-rolling). Best poker hand wins:

Five of a kind > four of a kind > full house > straight > three of a kind > two pair > pair > high die.

- Dedicated poker dice show **9-10-J-Q-K-A**; regular dice work fine with 1 low / 6 high
- **No flushes** (no suits), and straights need all five dice
- Aces high; ties split or roll off

> [!NOTE]
> Betting works like five-card draw: ante, roll, bet after the first roll and each re-roll. Also the engine inside Klondike (the dice game), Yacht, and, with the third roll added, Yahtzee itself.`,
		links: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Poker_dice' }],
	},
];

export const seedGames = async () => {
	if (Object.keys(games.data).length > 0) return;

	console.log(`Seeding ${seed.length} games`);

	const covers = [];

	for (const game of seed) {
		// imageSource is seed-only metadata (not a stored field); create() ignores it
		const created = await games.create(game);

		if (game.imageSource) covers.push({ id: created.id, source: game.imageSource });
	}

	// Populate covers in the background so startup isn't blocked on the network fetches
	if (covers.length > 0) fetchSeedCovers(covers).catch(error => console.error('Seed cover fetch error', error));
};
