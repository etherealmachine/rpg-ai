import { Compendium, CompendiumItem, Monster } from './Compendium';
import TerminalCodes from '../TerminalCodes';
import { Executable, Reader, Writer } from '../Shell';
import Session from '../Session';
import Levenshtein from 'fast-levenshtein';

interface Command extends Function {
  command: string;
  parse: (args: string) => (string | number)[];
  syntax: string;
  help: string;
}

function buildParser(argTypes: { name: string, type: string }[]): (args: string) => any[] {
  const re = new RegExp(argTypes.map(argType => {
    if (argType.type === 'number') {
      return '([\\d]' + (argType.name.endsWith('?') ? '*' : '+') + ')';
    } else if (argType.type === 'number[]') {
      return '([ \\d,]' + (argType.name.endsWith('?') ? '*' : '+') + ')';
    } else {
      return '([^\\d]' + (argType.name.endsWith('?') ? '*' : '+') + ')';
    }
  }).join(''));
  return (args: string): any[] => {
    const m = re.exec(args);
    console.log(args, m, re.source);
    if (!m) return [];
    return m.slice(1, m.length).map((arg, index) => {
      if (argTypes[index].type === 'number') {
        return parseInt(arg);
      } else if (argTypes[index].type === 'number[]') {
        return arg.split(',').map((s => parseInt(s.trim())));
      }
      return arg.trim();
    });
  }
}

const commands: { [key: string]: Command } = {};
function command(command: string, help: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const groups = command.split('<');
    descriptor.value.command = groups[0].trim();
    descriptor.value.syntax = command;
    descriptor.value.help = help;
    if (groups.length === 1) {
      descriptor.value.parse = () => { return [] };
    } else {
      groups.shift();
      descriptor.value.parse = buildParser(groups.map((group) => {
        const [name, type] = group.replace('>', '').split(': ');
        return {
          name: name.trim(),
          type: type.trim(),
        };
      }));
    };
    commands[descriptor.value.command] = descriptor.value;
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

function repr(e: Monster, index: number): string {
  return `${index + 1}. ${e.name}`;
}

export enum GameMode {
  DM = 0,
  Player
}

class GameState implements Executable {
  mode: GameMode;
  compendium: Compendium = new Compendium();
  session?: Session;
  setState: (g: GameState) => void;

  motd: Monster;
  encounter: Array<Monster> = [];
  currentIndex: number = 0;
  selected?: CompendiumItem;

  stdin?: Reader;
  stdout?: Writer;
  stderr?: Writer;

  constructor(mode: GameMode, compendium: Compendium, setState: (g: GameState) => void) {
    this.mode = mode;
    this.compendium = compendium;
    this.setState = setState;
    const monsterNames = Object.keys(this.compendium.monsters);
    this.motd = this.compendium.monsters[monsterNames[Math.floor(Math.random() * monsterNames.length)]];
    const savedState = window.localStorage.getItem('dnd5e.gamestate');
    if (mode === GameMode.DM && savedState) {
      const state = JSON.parse(savedState);
      Object.assign(this, state);
      if (state.sessionCode) {
        this.session = new Session(state.sessionCode);
      }
    }
  }

  private onChange() {
    this.setState(this);
    if (this.mode === GameMode.DM) {
      window.localStorage.setItem('dnd5e.gamestate', JSON.stringify(this));
      this.session?.send(this);
    }
  }

  toJSON() {
    return {
      encounter: this.encounter,
      currentIndex: this.currentIndex,
      sessionCode: this.session?.sessionCode,
    };
  }

  async execute(commandLine: string, stdin: Reader, stdout: Writer, stderr: Writer): Promise<number> {
    let command = undefined;
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;

    for (const key of Object.keys(commands)) {
      if (commandLine.startsWith(key)) {
        command = commands[key];
        commandLine = commandLine.replace(key, '').trim();
        break;
      }
    }
    if (command === undefined) {
      stderr.write(`unknown command: ${commandLine}\r\n`);
      return 1;
    }
    let result;
    try {
      result = await command.apply(this, command.parse(commandLine));
    } catch {
      this.stdin = undefined;
      this.stdout = undefined;
      this.stderr = undefined;
      return 1;
    }
    if (typeof result === 'string') {
      stdout.write(result);
      stdout.write('\r\n');
    } else if (result instanceof Promise) {
      try {
        result = await result;
      } catch {
        this.stdin = undefined;
        this.stdout = undefined;
        this.stderr = undefined;
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
      this.stdin = undefined;
      this.stdout = undefined;
      this.stderr = undefined;
    }
  }

  suggestions(partial: string): Array<string> {
    if (partial === "") {
      return new Array(...commands.keys());
    }
    for (const key of Object.keys(commands)) {
      if (partial.startsWith(key)) {
        partial = partial.replace(key, '').trim();
        break;
      }
    }
    return this.search(partial).map((item) => item.name).slice(0, 10);
  }

  startup() {
    let msg = `Welcome to rpg.ai, the shell for the busy DM!\r\nLoaded the DND5E Compendium.\r\nMonster of the day: ${this.motd?.name}\r\n`;
    if (this.session) {
      msg += `Resuming session "${this.session.sessionCode}"\r\n`;
    }
    if (this.encounter.length > 0) {
      msg += `Resuming your encounter with ${this.encounter.map((i) => i.name).join(', ')}\r\n`;
    }
    return msg;
  }

  search(query: string, kinds?: string[]): CompendiumItem[] {
    let items: CompendiumItem[] = [];
    if (kinds === undefined || kinds?.includes('background')) {
      items = items.concat(Object.values(this.compendium.backgrounds));
    }
    if (kinds === undefined || kinds?.includes('class')) {
      items = items.concat(Object.values(this.compendium.classes));
    }
    if (kinds === undefined || kinds?.includes('feat')) {
      items = items.concat(Object.values(this.compendium.feats));
    }
    if (kinds === undefined || kinds?.includes('item')) {
      items = items.concat(Object.values(this.compendium.items));
    }
    if (kinds === undefined || kinds?.includes('monster')) {
      items = items.concat(Object.values(this.compendium.monsters));
    }
    if (kinds === undefined || kinds?.includes('race')) {
      items = items.concat(Object.values(this.compendium.races));
    }
    if (kinds === undefined || kinds?.includes('spell')) {
      items = items.concat(Object.values(this.compendium.spells));
    }
    const editDistance = items.map((item, index) => {
      return { index: index, distance: Levenshtein.get(query.toLowerCase(), item.name.toLowerCase()) };
    });
    editDistance.sort((a, b) => {
      if (a.distance < b.distance) return -1;
      if (a.distance > b.distance) return 1;
      return 0;
    });
    return editDistance.map((item) => items[item.index]);
  }

  targets(a: number[]): Monster[] {
    return a.map(i => this.encounter[i - 1]);
  }

  @command('help', 'this help message')
  help() {
    return Array.from(Object.values(commands)).map((command) => `${command.syntax} - ${command.help}`).join('\r\n');
  }

  @command('new', 'start a new encounter')
  newEncounter() {
    this.encounter = [];
    return "started new encounter";
  }

  @command('reset', 'clear all saved state')
  async reset() {
    this.stdout?.write("are you sure (y/n)? ");
    const response = await this.stdin?.read();
    if (response === 'y') {
      this.encounter = [];
      return '\r\ncleared all saved state';
    } else {
      return "\r\ncancelled clearing bookmarks";
    };
  }

  @command('player <name: string> <level?: number>', 'add a player')
  addPlayer(name: string, level?: number) {
    this.encounter.push({
      name: name,
      kind: 'monster',
      hp: '',
      imageURL: '',
      ac: NaN,
      cr: NaN,
      passive: NaN,
      size: '',
      speed: '',
      str: NaN,
      dex: NaN,
      con: NaN,
      int: NaN,
      wis: NaN,
      cha: NaN,
      alignment: '',
      type: 'player',
      compendium: {},
      status: {
        hp: NaN,
        maxHP: NaN,
        actions: [],
        reactions: [],
        legendaries: [],
        conditions: [],
        initiative: NaN,
        level: level || NaN,
      }
    });
    return `added player ${name}`;
  }

  @command('add <name: string> <times?: number>', 'add a monster the current encounter')
  add(name: string, times?: number) {
    const results = this.search(name, ['monster']);
    if (results.length === 0) {
      return `no match found for ${name}`;
    }
    times = (times || 1);
    for (let i = 0; i < times; i++) {
      const monster = JSON.parse(JSON.stringify(results[0]));
      monster.status = {
        initiative: roll(20) + Compendium.modifier(monster.dex),
        actions: [],
        reactions: [],
        legendaries: [],
        conditions: [],
      };
      const m = monster.hp.match(/\d+ \((\d+)d(\d+)(\+(\d+))?\)/);
      if (m) {
        const num = parseInt(m[1]);
        const die = parseInt(m[2]);
        const bonus = parseInt(m[4]);
        monster.status.hp = roll(die, num) + (isNaN(bonus) ? 0 : bonus);
        monster.status.maxHP = monster.status.hp;
      }
      this.encounter.push(monster);
    }
    return `added ${times} ${results[0].name}`;
  }

  @command('rm <targets: number[]>', 'remove a monster or player from the current encounter')
  removeEntity(targets: number[]) {
    this.targets(targets).forEach((target) => {
      const removed = this.encounter.splice(this.encounter.indexOf(target), 1)[0];
      return `removed ${removed.name}`;
    });
  }

  @command('condition <targets: number[]> <condition: string>', 'toggle a condition')
  condition(targets: number[], condition: string) {
    condition = condition.toLowerCase();
    this.targets(targets).forEach((target) => {
      if (target.status?.conditions.indexOf(condition) !== -1) {
        target.status?.conditions.splice(target.status?.conditions.indexOf(condition), 1);
      } else {
        target.status?.conditions.push(condition);
      }
    });
  }

  @command('ls', 'list the status of the current encounter')
  listEncounter() {
    return this.encounter.map(repr).join('\r\n');
  }

  @command('init', 'roll initiative')
  async rollInitiative() {
    await Promise.all(this.encounter.map(async (e) => {
      if (e.status && isNaN(e.status.initiative)) {
        this.stdout?.write(`initiative for ${e.name}? `);
        if (!this.stdin) return;
        e.status.initiative = parseInt(await this.stdin.read());
      }
    }));
    this.encounter.sort((a, b) => {
      return (b.status?.initiative || 0) - (a.status?.initiative || 0);
    });
  }

  @command('curr', 'show the current turn')
  currTurn() {
    if (this.encounter.length === 0) {
      return 'empty encounter';
    }
    this.selected = this.encounter[this.currentIndex];
    return repr(this.encounter[this.currentIndex], this.currentIndex);
  }

  @command('next', 'advance turn to the next entity')
  nextTurn() {
    if (this.encounter.length === 0) {
      return 'empty encounter';
    }
    this.currentIndex++;
    this.currentIndex = this.currentIndex % this.encounter.length;
    this.selected = this.encounter[this.currentIndex];
    return this.currTurn();
  }

  @command('prev', 'rollback the turn by one entity')
  prevTurn() {
    if (this.encounter.length === 0) {
      return 'empty encounter';
    }
    this.currentIndex--;
    if (this.currentIndex === -1) {
      this.currentIndex = this.encounter.length - 1;
    }
    this.selected = this.encounter[this.currentIndex];
    return this.currTurn();
  }

  @command('dmg <targets: number[]> <points: number>', 'damage target')
  async dmg(targets: number[], points: number) {
    await Promise.all(this.targets(targets).map(async (target) => {
      if (!target.status) {
        return `${target.name} has no status`;
      }
      this.selected = target;
      let damage = points;
      if (target.vulnerable || target.resist || target.immune) {
        let multiplier = 1;
        if (target.vulnerable) {
          this.stdout?.write(`Vulnerable: ${target.vulnerable} (y/n)? `);
          if (await this.stdin?.read() === 'y') {
            multiplier = 2;
          }
          this.stdout?.write('\r\n');
        }
        if (target.resist) {
          this.stdout?.write(`Resist: ${target.resist} (y/n)? `);
          if (await this.stdin?.read() === 'y') {
            multiplier = 0.5;
          }
          this.stdout?.write('\r\n');
        }
        if (target.immune) {
          this.stdout?.write(`Immune: ${target.immune} (y/n)? `);
          if (await this.stdin?.read() === 'y') {
            multiplier = 0;
          }
          this.stdout?.write('\r\n');
        }
        damage = Math.floor(points * multiplier);
      }
      target.status.hp -= damage;
      this.stdout?.write(`${target.name} took ${damage} points of damage\r\n`);
    }));
  }

  @command('dc <dc: number> <attribute: string> <targets: number[]>', 'roll a saving throw')
  save(dc: number, attribute: string, targets: number[]) {
    const attr = Compendium.abilities.find((a: string) => (a.toLowerCase().substring(0, 3) === attribute));
    if (!attr) {
      this.stderr?.write(`unknown attriubte ${attribute}\r\n`);
      return;
    }
    this.targets(targets).forEach((target) => {
      const targetAbility = (target as any)[attr.substring(0, 3).toLowerCase()];
      const savingThrow = roll(20, 1);
      const modifier = Compendium.modifier(targetAbility);
      const result = (savingThrow + modifier) >= dc ? 'passes' : 'fails';
      this.stdout?.write(`${target.name} rolls a ${savingThrow + modifier} (${savingThrow}+${modifier}) and ${result}\r\n`);
    });
  }

  @command('use <action: number> <targets: number[]>', 'perform action on the current entity')
  use(action: number, targets: number[]) {
    if (targets.length === 0) {
      targets.push(this.currentIndex);
    }
    this.targets(targets).forEach((target) => {
      if (!target.action) return;
      if (!('length' in target.action)) return;
      const a = target.action[action - 1];
      target.status?.actions.push(a);
      const m = a.text.match(/\+(\d+) to hit.*\((\d)+d(\d+)[ +]*(\d*)\) (\w+) damage/);
      if (m) {
        const [toHitBonusStr, nStr, dieStr, dmgBonusStr, dmgType] = m.slice(1);
        const toHitBonus = parseInt(toHitBonusStr);
        const n = parseInt(nStr);
        const dmgDie = parseInt(dieStr);
        const dmgBonus = parseInt(dmgBonusStr);
        const toHit = roll(20) + toHitBonus;
        let dmg = 0;
        for (let i = 0; i < n; i++) {
          dmg += roll(dmgDie);
        }
        dmg += dmgBonus;
        this.stdout?.write(`does a ${toHit} hit? ${dmg} points of ${dmgType} damage\r\n`);
      }
    });
  }

  @command('show <query: string>', 'show a card for the given item')
  show(query: string) {
    const results = this.search(query);
    if (results.length === 0) {
      return `no match found for ${query}`;
    }
    this.selected = results[0];
  }

  @command('host', 'host a new session')
  host(code: string): Promise<void> {
    if (this.session) {
      this.session.teardown();
    }
    this.session = new Session(code);
    this.mode = GameMode.DM;
    this.session.onMessage = (obj: any) => {
      if (obj === "new_peer") {
        this.session?.send(this);
      }
    };
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
    this.mode = GameMode.Player;
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
      if (this.mode === GameMode.DM) {
        this.session?.send(this);
      } else {
        this.session?.send('new_peer');
      }
      resolve();
    };
  }

}

export default GameState