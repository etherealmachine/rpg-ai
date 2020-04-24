import { Executable, Reader, Writer } from './Shell';
import Session from './Session';
import TerminalCodes from './TerminalCodes';

class Command {
  command: string
  args: Argument[]
  regex: RegExp
  syntax: string
  help: string
  f: Function

  constructor(syntax: string, help: string, f: Function) {
    this.syntax = syntax;
    this.help = help;
    this.f = f;
    const groups = syntax.split('<');
    this.command = groups[0].trim();
    groups.shift();
    this.args = groups.map((group) => {
      const [name, type] = group.replace('>', '').split(': ');
      return {
        name: name.trim().replace('?', ''),
        type: type.trim(),
        optional: name.endsWith('?'),
      };
    });
    this.regex = new RegExp(this.args.map(arg => {
      if (arg.type === 'number') {
        return '(-?[-\\d]' + (arg.optional ? '*' : '+') + ')';
      } else if (arg.type === 'number[]') {
        return '(-?[\\d,]' + (arg.optional ? '*' : '+') + ')';
      } else {
        return '(.' + (arg.optional ? '*?' : '+?') + ')';
      }
    }).join('\\s+') + '$');
  }

  execute(game: GameState, commandLine: string) {
    game.log?.write(`executing ${this.syntax}\r\n`);
    return this.f.apply(game, this.parse(commandLine, game.log));
  }

  parse(commandLine: string, out?: Writer): (string | number | number[] | undefined)[] {
    const match = commandLine.match(this.regex);
    out?.write(`"${commandLine}".match(/${this.regex}/)\r\n`)
    out?.write(JSON.stringify(match) + "\r\n")
    if (!match) return [commandLine];
    return match.slice(1, match.length).map((arg, index) => {
      arg = arg.trim();
      out?.write(`arg ${index}: "${arg}": ${this.args[index].type}\r\n`)
      switch (this.args[index].type) {
        case "number":
          if (isNaN(parseInt(arg))) {
            if (this.args[index].optional) {
              return undefined;
            }
            throw new Error(`failed to parse ${arg} as non-optional argument ${this.args[index].name}: number`);
          }
          return parseInt(arg);
        case "number[]":
          const numbers = arg.split(',').map((s => parseInt(s.trim())));
          if (numbers.length === 0 || numbers.some(isNaN)) {
            if (this.args[index].optional) {
              return undefined;
            }
            throw new Error(`failed to parse ${arg} as non-optional argument ${this.args[index].name}: number[]`);
          }
          return numbers;
        case "string | number":
          if (isNaN(parseInt(arg))) {
            return arg;
          }
          return parseInt(arg);
        case "string":
          return arg;
        default:
          throw new Error(`error parsing ${commandLine}, unknown type ${this.args[index].type}`);
      }
    });
  }
}

interface Argument {
  name: string
  type: string
  optional: boolean
}

const commands: { [key: string]: Command } = {};
function command(syntax: string, help: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const command = new Command(syntax, help, descriptor.value);
    commands[command.command] = command;
  }
}

function roll(d: number, count?: number): number {
  let sum = 0;
  if (count === undefined) count = 1;
  for (; count > 0; count--) {
    sum += Math.floor(Math.random() * d) + 1;
  }
  return sum;
}

class GameState implements Executable {
  session?: Session;
  setState: (g: GameState) => void;

  stdin?: Reader;
  stdout?: Writer;
  stderr?: Writer;
  log?: Writer;

  constructor(setState: (g: GameState) => void) {
    this.setState = setState;
    const savedState = window.localStorage.getItem('mud.gamestate');
    if (savedState) {
      const state = JSON.parse(savedState);
      Object.assign(this, state);
      if (state.sessionCode) {
        this.session = new Session(state.sessionCode);
      }
    }
  }

  onChange() {
    this.setState(this);
    window.localStorage.setItem('mud.gamestate', JSON.stringify(this));
    this.session?.send(this);
  }

  toJSON() {
    return {
      sessionCode: this.session?.sessionCode,
    };
  }

  resetState() {
    this.leave();
  }

  async execute(commandLine: string): Promise<number> {
    let command = undefined;

    for (const key of Object.keys(commands)) {
      if (commandLine.startsWith(key)) {
        command = commands[key];
        commandLine = commandLine.replace(key, '').trim();
        break;
      }
    }
    if (command === undefined) {
      this.stderr?.write(`unknown command: ${commandLine}\r\n`);
      return 1;
    }
    let result;
    try {
      result = await command.execute(this, commandLine);
    } catch (err) {
      console.error(err);
      if (err) {
        this.stderr?.write(err.toString());
        this.stderr?.write('\r\n');
      } else {
        this.stderr?.write("unknown error\r\n");
      }
      return 1;
    }
    if (typeof result === 'string') {
      this.stdout?.write(result);
      this.stdout?.write('\r\n');
    } else if (result instanceof Promise) {
      try {
        result = await result;
      } catch {
        return 1;
      }
    }
    this.onChange();
    return 0;
  }

  cancel(): void {
    if (this.session) {
      this.session.teardown();
      this.session = undefined;
    }
  }

  suggestions(partial: string) {
    return [];
  }

  startup() {
    return '';
  }

  @command('help <command?: string>', 'this help message')
  help(command?: string) {
    return 'todo';
  }

  @command('reset', 'clear all saved state')
  async reset() {
    this.stdout?.write("are you sure (y/n)? ");
    const response = await this.stdin?.read();
    if (response === 'y') {
      this.resetState();
      return '\r\ncleared all saved state';
    } else {
      return "\r\ncancelled reset";
    };
  }

  @command('roll <desc: string>', 'roll them bones')
  roll(desc: string) {
    const m = desc.match(/(\d+)d(\d+)[+]?(\d+)?/);
    if (m) {
      const n = parseInt(m[1]);
      const die = parseInt(m[2]);
      const bonus = parseInt(m[3]);
      this.stdout?.write(`${roll(die, n) + (bonus || 0)}\r\n`);
    }
  }

  @command('host <code: string>', 'host a new session')
  host(code: string): Promise<void> {
    if (this.session) {
      this.session.teardown();
    }
    this.session = new Session(code);
    this.session.onMessage = (obj: any) => {
      if (obj === "new_peer") {
        this.session?.send(this);
      }
    };
    this.stdout?.write(`Join at ${window.location}?session=${encodeURI(code)}\r\n`);
    return new Promise((resolve, reject) => {
      this.attachSessionHandlers(resolve, reject);
      this.session?.connect();
    });
  }

  @command('join', 'join an existing session')
  join(code: string): Promise<void> {
    if (this.session) {
      this.session.teardown();
    }
    this.session = new Session(code);
    this.session.onMessage = (obj: any) => {
      if (obj !== "new_peer") {
        Object.assign(this, obj);
        this.onChange();
      }
    };
    this.onChange();
    return new Promise((resolve, reject) => {
      this.attachSessionHandlers(resolve, reject);
      this.session?.connect();
    });
  }

  @command('leave', 'leave the existing session')
  leave() {
    this.session?.teardown();
    this.session = undefined;
  }

  attachSessionHandlers(resolve: () => void, reject: () => void) {
    if (!this.session) return;
    this.session.onEvent = (event) => {
      this.stdout?.write(event);
      this.stdout?.write('\r\n')
    };
    this.session.onError = (error) => {
      this.stderr?.write(TerminalCodes.Red);
      this.stderr?.write(error);
      this.stderr?.write(TerminalCodes.Reset);
      this.stdout?.write('\r\n');
      reject();
    };
    this.session.onConnect = () => {
      this.stderr?.write(TerminalCodes.Green);
      this.stderr?.write('connection established!');
      this.stderr?.write(TerminalCodes.Reset);
      this.stdout?.write('\r\n');
      this.session?.send(this);
      this.session?.send('new_peer');
      resolve();
    };
  }

}

export default GameState