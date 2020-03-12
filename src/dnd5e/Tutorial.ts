import { Writer } from '../Shell';
import GameState from './GameState';
import TerminalCodes from '../TerminalCodes';

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
> rm 1`,
  },
  {
    prompt: `We need players, so go ahead and add him back in. You can also try to use the up and down arrow keys to navigate
the history and find the command you executed to add him.`,
    check: (game: GameState) => {
      return game.encounter.length === 1 && game.encounter[0].type === 'player' && game.encounter[0].name === 'Applewhite'
    },
  },
  {
    prompt: `Try adding a few more players
> player Varis 4`,
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type === 'player').length === 2;
    },
  },
  {
    prompt: `> player House 3`,
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type === 'player').length === 3;
    },
  },
  {
    prompt: `Ok, we have 3 players now, let's add some monsters for them to fight!
> add orc`,
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type !== 'player').length === 1;
    },
  },
  {
    prompt: `> add goblin 3`,
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type !== 'player').length === 4;
    },
  },
  {
    prompt: `As you can see, the add command takes a monster name and an optional number of monsters to add.
You can search monsters with the monster command, e.g.
> monster darkmantle
> add darkmantle
You can also try using the tab key to search the compendium for matches. Try searching for your
favorite monster now.`,
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type !== 'player').length === 5;
    },
  },
  {
    prompt: `This is a good start. Let's check if the encounter is balanced.
> balance`
  },
]

export default class Tutorial {

  static next(game: GameState): number | undefined {
    if (!game.stdout) return;
    const step = game.tutorialStep;
    if (step === undefined) return;
    const prev = steps[step];
    if (prev && prev.check && !prev.check(game)) {
      this.writePrompt(prev.prompt, game.stdout);
      return step;
    }
    const curr = steps[step + 1];
    if (!curr) return;
    this.writePrompt(curr.prompt, game.stdout);
    return step + 1;
  }

  static writePrompt(prompt: string, out: Writer) {
    out.write(TerminalCodes.Yellow);
    out.write(prompt.split('\n').join('\r\n'));
    out.write(TerminalCodes.Reset);
    out.write('\r\n');
  }

}