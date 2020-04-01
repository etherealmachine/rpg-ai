import { Writer } from '../Shell';
import GameState from './GameState';
import TerminalCodes from '../TerminalCodes';

function em(s: string): string {
  return `${TerminalCodes.Red}${s}${TerminalCodes.Yellow}`;
}

export const TutorialSteps = [
  {
    prompt: `The DND5E module is designed to help you track an encounter.
You can exit this tutorial with the ${em('reset')} command.
Let's get started by adding some players!
Try the command "help player"`,
  },
  {
    prompt: `This means the player command takes up to 2 arguments, the name of the player (required) and their level (optional)
For example,
> player Applewhite 4`,
    command: "player Applewhite 4",
    check: (game: GameState) => {
      return game.encounter.length === 1 && game.encounter[0].type === 'player' && game.encounter[0].name === 'Applewhite'
    },
  },
  {
    prompt: `The encounter table should now show Applewhite, along with their respective level.
Each item in the encounter has an index. You can remove items by their index with the ${em('rm')} command, for example:
> rm 1`,
    command: "rm 1",
  },
  {
    prompt: `We need players, so go ahead and add him back in. You can also try to use the ${em('⬆')} and ${em('⬇')} arrow keys to navigate
the history and find the command you executed to add him.`,
    command: "player Applewhite 4",
    check: (game: GameState) => {
      return game.encounter.length === 1 && game.encounter[0].type === 'player' && game.encounter[0].name === 'Applewhite'
    },
  },
  {
    prompt: `Try adding a few more players
> player Varis 4`,
    command: "player Varis 4",
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type === 'player').length === 2;
    },
  },
  {
    prompt: `> player House 3`,
    command: "player House 3",
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type === 'player').length === 3;
    },
  },
  {
    prompt: `Ok, we have 3 players now, let's add some monsters for them to fight!
> add orc`,
    command: "add orc",
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type !== 'player').length === 1;
    },
  },
  {
    prompt: `> add goblin 2`,
    command: "add goblin 2",
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type !== 'player').length === 3;
    },
  },
  {
    prompt: `As you can see, the add command takes a monster name and an optional number of monsters to add.
You can search monsters with the monster command, e.g.
> monster darkmantle
You can also try using the ${em('tab')} key to search the compendium for matches. Try searching for your
favorite monster now.`,
  },
  {
    prompt: `Add another monster
> add darkmantle`,
    command: "add darkmantle",
    check: (game: GameState) => {
      return game.encounter.filter((e) => e.type !== 'player').length === 4;
    },
  },
  {
    prompt: `This is a good start. Let's check if the encounter is balanced.
> balance`,
    check: (game: GameState) => {
      const balance = game.balance();
      return balance.startsWith("easy");
    }
  },
  {
    prompt: `Looks like it's a bit easy. Adding CR 1/8 will bring it up to medium, so let's add another Orc
> add orc`,
    command: 'add orc',
  },
  {
    prompt: `Ok, it's balanced enough, let's roll initiative!
The initiative command will prompt you for player initiatives, just make something up.
> init`,
    check: (game: GameState) => {
      const balance = game.balance();
      return balance.startsWith("medium") && game.encounter.every(e => e.status?.initiative);
    }
  },
  {
    prompt: `That's the end of this tutorial, feel free to play around with the encounter we've set up.
${em('use')}, ${em('cast')}, ${em('condition')}, ${em('dc')}, and ${em('dmg')} all affect the status of a target.
You can just roll dice, e.g. ${em('roll 1d20+6')}.
And search for anything (e.g. monsters, items, spells) with the ${em('show')} command.
If you need anything else, there's always the ${TerminalCodes.Red}help${TerminalCodes.Yellow} command.${TerminalCodes.Reset}`,
  },
]

export default class Tutorial {

  static async replay(game: GameState) {
    if (!game.tutorialStep) return;
    const lastStep = game.tutorialStep - 1;
    game.resetState();
    const tmp = game.stdout;
    game.stdout = undefined;
    for (let i = 0; i <= lastStep; i++) {
      const step = TutorialSteps[i];
      if (step.command) await game.execute(step.command);
    }
    game.tutorialStep = lastStep;
    game.stdout = tmp;
  }

  static next(game: GameState): number | undefined {
    if (!game.stdout) return;
    const step = game.tutorialStep;
    if (step === undefined) return;
    const prev = TutorialSteps[step];
    if (prev && prev.check && !prev.check(game)) {
      this.writePrompt(prev.prompt, game.stdout);
      return step;
    }
    const curr = TutorialSteps[step + 1];
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