import GameState from './GameState';

const steps = [
  {
    prompt: `The DND5E module is designed to help you track an encounter.
Let's get started by adding some players!
Try the command "help player"`,
  },
  {
    prompt: `This means the player command takes up to 2 arguments, the name of the player (required) and their level (optional)
For example,
> player Applewhite 4`,
    check: (game: GameState) => {
      return game.encounter.length === 1 && game.encounter[0].type === 'player' && game.encounter[0].name === 'Applewhite'
    },
  },
  {
    prompt: `The encounter table should now show your 2 players, along with their respective levels.
Each item in the encounter has an index. You can remove items by their index with the rm command, for example:
> rm 1`
  },
  {
    prompt: `We need players, so go ahead and add him back in. You can also try to use the up and down arrow keys to navigate
the history and find the command you executed to add him.`
  },
  {
    prompt: `Try adding a few more players
> player Varis 4`
  },
  {
    prompt: `> player House 3`
  },
  {
    prompt: `Ok, we have 3 players now, let's add some monsters for them to fight!
> add orc`
  },
  {
    prompt: `> add goblin 3`,
  },
  {
    prompt: `As you can see, the add command takes a monster name and an optional number of monsters to add.
You can search monsters with the monster command, e.g.
> monster darkmantle
You can also try using the tab key to search the compendium for matches. Try searching for your
favorite monster now.`
  },
  {
    prompt: `This is a good start. Let's check if the encounter is balanced.
> balance`
  },
]

export default class Tutorial {

  game: GameState
  step = -1;

  constructor(game: GameState) {
    this.game = game;
  }

  next(): string | undefined {
    this.step += 1;
    if (this.step >= steps.length) return undefined;
    return steps[this.step].split('\n').join('\r\n');
  }

}