import { Compendium, CompendiumItem, Monster, Player } from './Compendium';
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

function buildParser(argTypes: { name: string, type: string }[]): (args: string) => (string | number)[] {
  return (args: string): (string | number)[] => {
    if (argTypes.length === 1 && argTypes[0].type === 'string') {
      return [args];
    }
    return args.split(' ').map((arg, index) => {
      if (argTypes[index].type === 'number') {
        return parseInt(arg);
      }
      return arg;
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
          name,
          type,
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
    sum += Math.floor(Math.random() * d);
  }
  return sum;
}

function repr(e: Monster | Player, index: number): string {
  return `${index + 1}. ${e.name}`;
}

class GameState implements Executable {
  mode: string = "dm";
  compendium: Compendium = new Compendium();
  onChange: (g: GameState) => void;

  motd: Monster;
  players: { [key: string]: Player } = {};
  encounter: Array<Monster | Player> = [];
  currentIndex: number = 0;
  bookmarks: { [key: string]: CompendiumItem } = {};
  selected?: CompendiumItem;

  stdin?: Reader;
  stdout?: Writer;
  stderr?: Writer;

  constructor(compendium: Compendium, onChange: (g: GameState) => void) {
    this.compendium = compendium;
    this.onChange = onChange;
    const monsterNames = Object.keys(this.compendium.monsters);
    this.motd = this.compendium.monsters[monsterNames[Math.floor(Math.random() * monsterNames.length)]];
  }

  toJSON() {
    return {
      players: this.players,
      encounter: this.encounter,
      currentIndex: this.currentIndex,
      bookmarks: this.bookmarks,
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
    if (this.mode === 'dm') {
      this.session?.send(this);
    }
    this.onChange(this);
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
    return this.search(partial).map((item) => item.name).slice(0, 10);
  }

  startup() {
    let encounter = '';
    if (this.encounter.length > 0) {
      encounter = `Resuming your encounter with ${this.encounter.map((i) => i.name).join(', ')}\r\n`;
    }
    return `Welcome to rpg.ai, the shell for the busy DM!\r\nLoaded the DND5E Compendium.\r\nMonster of the day: ${this.motd?.name}\r\n${encounter}`;
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

  @command('help', 'this help message')
  help() {
    return Array.from(Object.values(commands)).map((command) => `${command.syntax} - ${command.help}`).join('\r\n');
  }

  @command('new', 'start a new encounter')
  newEncounter() {
    Object.values(this.players).forEach((player) => { player.status = { initiative: NaN }; });
    this.encounter = [];
    return "started new encounter";
  }

  @command('clear bookmarks', 'clear saved bookmarks')
  clearBookmarks() {
    return {
      prompt: "are you sure (y/n)? ",
      callback: (answer: string) => {
        if (answer === 'y') {
          this.bookmarks = {};
          return "cleared bookmarks";
        }
        return "cancelled clearing bookmarks";
      }
    };
  }

  @command('reset', 'clear all saved state')
  async reset() {
    this.stdout?.write("are you sure (y/n)? ");
    const response = await this.stdin?.read();
    if (response === 'y') {
      this.bookmarks = {};
      this.encounter = [];
      this.players = {};
      return '\r\ncleared all saved state';
    } else {
      return "\r\ncancelled clearing bookmarks";
    };
  }

  @command('roster', 'list players')
  listPlayers() {
    return Object.keys(this.players).map((playerName, index) => `${index + 1}: ${playerName}`).join('\r\n');
  }

  @command('player <level: number>', 'add a player')
  addPlayer(name: string) {
    this.players[name] = {
      name: name,
      kind: 'player',
      status: {
        initiative: NaN,
      },
    };
    return `added player ${name}`;
  }

  @command('add <name: string>', 'add a monster or player to the current encounter')
  addEntity(name: string) {
    const matchingPlayers = Object.keys(this.players).filter((key) => key.toLowerCase() === name.toLowerCase());
    if (matchingPlayers.length === 1) {
      const player = this.players[matchingPlayers[0]];
      this.encounter.push(player);
      return `added ${player.name}`;
    }
    const results = this.search(name, ['monster']);
    if (results.length === 0) {
      return `no match found for ${name}`;
    }
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
    return `added ${monster.name}`;
  }

  @command('rm <i: number>', 'remove a monster or player from the current encounter')
  removeEntity(i: number) {
    i--;
    if (isNaN(i) && this.currentIndex !== undefined) {
      i = this.currentIndex;
    }
    if (i >= 0 && i < this.encounter.length) {
      const removed = this.encounter.splice(i, 1)[0];
      return `removed ${removed.name}`;
    }
    return 'index out of bounds'
  }

  @command('ls', 'list the status of the current encounter')
  listEncounter() {
    return this.encounter.map(repr).join('\r\n');
  }

  @command('bookmark <name: string>', 'bookmark an item')
  bookmark(name: string) {
    const results = this.search(name);
    if (results.length === 0) {
      return `no match found for ${name}`;
    }
    const item = results[0];
    this.bookmarks[item.name] = item;
    return `bookmarked ${item.name} `;
  }

  @command('init', 'roll initiative')
  async rollInitiative() {
    await Promise.all(this.encounter.map(async (e) => {
      if (e.kind === 'player' && e.status && isNaN(e.status.initiative)) {
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

  @command('actions', 'show actions for the current entity')
  actions() {
    const current = this.encounter[this.currentIndex];
    if (current.kind === 'player') {
      return `ask ${current.name} what they want to do`
    }
    let actions = current.action || [];
    if (!(actions instanceof Array)) {
      actions = [actions];
    }
    return actions.map((action, i) => `${i + 1}: ${action.name} - ${action.text}`).join('\r\n');
  }

  @command('dmg <i: number> <points: number>', 'damage target')
  async dmg(i: number, points: number) {
    i--;
    if (i < 0 || i >= this.encounter.length) {
      return `target ${i} is out-of-bounds`;
    }
    const target = this.encounter[i];
    if (target.kind === 'player') {
      return `cannot damage player ${target.name}`;
    }
    if (!target.status) {
      return `${target.name} has no status`;
    }
    this.selected = target;
    let damage = points;
    if (target.vulnerable || target.resist || target.immune) {
      if (target.vulnerable) this.stdout?.write(`Vulnerable: ${target.vulnerable}\r\n`);
      if (target.resist) this.stdout?.write(`Resist: ${target.resist}\r\n`);
      if (target.immune) this.stdout?.write(`Immune: ${target.immune}\r\n`);
      this.stdout?.write('damage multiplier? ');
      const multiplier = parseFloat(await this.stdin?.read() || '1');
      this.stdout?.write('\r\n');
      damage = Math.floor(points * multiplier);
    }
    target.status.hp -= damage;
    return `${target.name} took ${damage} points of damage`;
  }

  @command('dc <dc: number> <attr: string>', 'roll a saving throw')
  async save(dc: number, attribute: string) {
    const attr = Compendium.abilities.find((a: string) => (a.toLowerCase().substring(0, 3) === attribute));
    if (!attr) {
      this.stderr?.write(`unknown attriubte ${attribute}\r\n`);
      return;
    }
    this.stdout?.write(`making a ${attr} saving throw, targets? `);
    const targets = (await this.stdin?.read() || '').split(' ');
    this.stdout?.write('\r\n');
    targets.forEach((s: string) => {
      const i = parseInt(s) - 1;
      if (i < 0 || i >= this.encounter.length) {
        return;
      }
      const target = this.encounter[i];
      if (target.kind === 'player') {
        return;
      }
      const targetAbility = (target as any)[attr.substring(0, 3).toLowerCase()];
      const savingThrow = roll(20, 1);
      const modifier = Compendium.modifier(targetAbility);
      const result = (savingThrow + modifier) >= dc ? 'passes' : 'fails';
      this.stdout?.write(`${i + 1}. ${target.name} rolls a ${savingThrow + modifier} (${savingThrow}+${modifier}) and ${result}\r\n`);
    });
  }

  @command('use <i: number>', 'perform action on the current entity')
  use(i: number) {
    i--;
    const current = this.encounter[this.currentIndex];
    if (current.kind === 'player') {
      return `todo`
    }
    let actions = current.action || [];
    if (!(actions instanceof Array)) {
      actions = [actions];
    }
    const action = actions[i].text;
    current.status?.actions.push({
      name: action,
      text: '',
    });
    const m = action.match(/\+(\d+) to hit.*\((\d)+d(\d+)[ +]*(\d*)\) (\w+) damage/);
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
      return `does a ${toHit} hit? ${dmg} points of ${dmgType} damage`;
    }
    return action;
  }

  @command('show <query: string>', 'show a card for the given item')
  show(query: string) {
    const results = this.search(query);
    if (results.length === 0) {
      return `no match found for ${query}`;
    }
    this.selected = results[0];
  }

  session?: Session;

  @command('host <code: string>', 'host a new session')
  host(code: string): Promise<void> {
    if (this.session) {
      this.session.teardown();
    }
    this.session = new Session();
    return new Promise((resolve, reject) => {
      this.attachSessionHandlers(resolve, reject);
      this.session?.connect(code);
    });
  }

  @command('join <code: string>', 'join an existing session')
  join(code: string): Promise<void> {
    if (this.session) {
      this.session.teardown();
    }
    this.session = new Session();
    this.mode = "player";
    this.session.onMessage = (obj: string) => {
      Object.assign(this, obj);
      this.onChange(this);
    };
    this.onChange(this);
    return new Promise((resolve, reject) => {
      this.attachSessionHandlers(resolve, reject);
      this.session?.connect(code);
    });
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
      if (this.mode === 'dm') {
        this.session?.send(this);
      }
      resolve();
    };
  }

}

export default GameState