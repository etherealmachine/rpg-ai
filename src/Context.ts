import { Compendium, CompendiumItem, Monster, Player } from './Compendium';
import TerminalCodes from './TerminalCodes';
import Sync from './Connection';
import Levenshtein from 'fast-levenshtein';

(window as any).Sync = Sync;

interface Command extends Function {
  command: string;
  help: string;
}

const commands = new Map<string, Command>();
function command(command: string, help: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.value.command = command;
    descriptor.value.help = help;
    commands.set(command, descriptor.value);
  };
}

const DEFAULT_PROMPT = `${TerminalCodes.Red}${TerminalCodes.Bold}rpg.ai > ${TerminalCodes.Reset}`;

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

interface Prompt {
  prompt: string;
  callback?: Function;
  output?: string;
}

class Context {
  prompt: Prompt = {
    prompt: DEFAULT_PROMPT,
  };
  compendium: Compendium = new Compendium();
  onChangeFns: ((c: Context) => void)[] = [];

  motd?: Monster;
  players: { [key: string]: Player } = {};
  encounter: Array<Monster | Player> = [];
  currentIndex: number = 0;
  bookmarks: { [key: string]: CompendiumItem } = {};

  constructor(compendium: string) {
    const savedState = window.localStorage.getItem('context');
    if (savedState) {
      Object.assign(this, JSON.parse(savedState));
    }
    this.compendium.load(compendium).then(() => {
      const monsterNames = Object.keys(this.compendium.monsters);
      this.motd = this.compendium.monsters[monsterNames[Math.floor(Math.random() * monsterNames.length)]];
      this.onChangeFns.forEach((fn) => fn(this));
    });
  }

  toJSON() {
    return JSON.stringify(this, [
      'players',
      'encounter',
      'currentIndex',
      'bookmarks',
    ]);
  }

  onChange(fn: (c: Context) => void) {
    this.onChangeFns.push(fn);
  }

  execute(commandLine: string) {
    let command = undefined;

    if (this.prompt.callback) {
      command = this.prompt.callback;
    } else {
      for (const key of commands.keys()) {
        if (commandLine.startsWith(key)) {
          command = commands.get(key);
          commandLine = commandLine.replace(key, '').trim();
          break;
        }
      }
    }
    if (command === undefined) {
      this.prompt = {
        prompt: DEFAULT_PROMPT,
        output: `unknown command: ${commandLine}`,
      }
      return;
    }
    const result = command.call(this, commandLine);
    if (typeof result === 'string') {
      this.prompt = {
        prompt: DEFAULT_PROMPT,
        output: result,
      }
    } else {
      this.prompt = result;
    }
    window.localStorage.setItem("context", this.toJSON());
    this.onChangeFns.forEach((fn) => fn(this));
  }

  suggestions(partial: string): Array<string> {
    if (partial === "") {
      return new Array(...commands.keys());
    }
    return this.search(partial).map((item) => item.name).slice(0, 10);
  }

  welcomeMsg() {
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
    return Array.from(commands.values()).map((command) => `${command.command} - ${command.help}`).join('\r\n');
  }

  @command('new', 'start a new encounter')
  newEncounter() {
    Object.values(this.players).forEach((player) => { player.initiative = undefined; });
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
  reset() {
    return {
      prompt: "are you sure (y/n)? ",
      callback: (answer: string) => {
        if (answer === 'y') {
          this.bookmarks = {};
          this.encounter = [];
          this.players = {};
          return 'cleared all saved state';
        }
        return "cancelled clearing bookmarks";
      }
    };
  }

  @command('add player', 'add a player')
  addPlayer(name: string) {
    this.players[name] = {
      name: name,
      kind: 'player',
    };
    return `added player ${name}`;
  }

  @command('add', 'add a monster or player to the current encounter')
  addEntity(query: string) {
    const matchingPlayers = Object.keys(this.players).filter((name) => name.toLowerCase() === query.toLowerCase());
    if (matchingPlayers.length === 1) {
      const player = this.players[matchingPlayers[0]];
      this.encounter.push(player);
      return `added ${player.name}`;
    }
    const results = this.search(query, ['monster']);
    if (results.length === 0) {
      return `no match found for ${query}`;
    }
    const monster = JSON.parse(JSON.stringify(results[0]));
    monster.initiative = roll(20) + Compendium.modifier(monster.dex);
    const m = monster.hp.match(/\d+ \((\d+)d(\d+)(\+(\d+))?\)/);
    if (m) {
      const num = parseInt(m[1]);
      const die = parseInt(m[2]);
      const bonus = parseInt(m[4]);
      monster.hp = roll(die, num) + (isNaN(bonus) ? 0 : bonus);
    }
    this.encounter.push(monster);
    return `added ${monster.name}`;
  }

  @command('remove', 'remove a monster or player from the current encounter')
  removeEntity(i: string | number) {
    if (typeof i === 'string') {
      i = parseInt(i) - 1;
    }
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

  @command('players', 'list players')
  listPlayers() {
    return Object.keys(this.players).map((playerName, index) => `${index + 1}: ${playerName}`).join('\r\n');
  }

  @command('bookmark', 'bookmark an item')
  bookmark(query: string) {
    const results = this.search(query);
    if (results.length === 0) {
      return `no match found for ${query}`;
    }
    const item = results[0];
    this.bookmarks[item.name] = item;
    return `bookmarked ${item.name} `;
  }

  @command('init', 'roll initiative')
  rollInitiative() {
    let rolls = '';
    this.encounter.forEach((item) => {
      if (item.kind === 'monster' && item.initiative === undefined) {
        item.initiative = roll(20) + Compendium.modifier(item.dex);
        rolls += `${item.name} rolled a ${item.initiative}\r\n`;
      }
    });
    const neededPlayers = this.encounter.filter((item) => item.kind === 'player' && item.initiative === undefined);
    if (neededPlayers.length > 0) {
      return {
        output: rolls,
        prompt: `initiative for ${neededPlayers[0].name}? `,
        callback: this.collectInitiative.bind(this),
      };
    }
    this.encounter.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    return this.listEncounter();
  }

  collectInitiative(initiative: string | number): Prompt | string {
    if (typeof initiative === 'string') {
      initiative = parseInt(initiative);
    }
    let neededPlayers = this.encounter.filter((item) => item.kind === 'player' && item.initiative === undefined);
    neededPlayers[0].initiative = initiative;
    neededPlayers = this.encounter.filter((item) => item.kind === 'player' && item.initiative === undefined);
    if (neededPlayers.length > 0) {
      return {
        prompt: `initiative for ${neededPlayers[0].name}? `,
        callback: this.collectInitiative.bind(this),
      };
    }
    this.encounter.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    return this.listEncounter();
  }

  @command('curr', 'show the current turn')
  currTurn() {
    if (this.encounter.length === 0) {
      return 'empty encounter';
    }
    return repr(this.encounter[this.currentIndex], this.currentIndex);
  }

  @command('next', 'advance turn to the next entity')
  nextTurn() {
    if (this.encounter.length === 0) {
      return 'empty encounter';
    }
    this.currentIndex++;
    this.currentIndex = this.currentIndex % this.encounter.length;
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

  @command('dmg', 'damage target')
  dmg(i: string | number, points: string | number, dmgType: string) {
    if (typeof i === 'string') {
      i = parseInt(i) - 1;
    }
    if (typeof points === 'string') {
      points = parseInt(points);
    }
    if (i < 0 || i >= this.encounter.length) {
      return `target ${i} is out-of-bounds`;
    }
    const target = this.encounter[i];
    if (target.kind === 'player') {
      return `cannot damage player ${target.name}`;
    }
    return `${target.name} took ${this.damageMonster(target, points, dmgType)} points of damage`;
  }

  damageMonster(monster: Monster, points: number, dmgType: string): number {
    const damageMultipler = Compendium.damageMultiplier(monster, dmgType);
    const damage = Math.floor(points * damageMultipler);
    if (typeof monster.hp === 'string') {
      const m = monster.hp.match(/\d+ \((\d+)d(\d+)(\+(\d+))?\)/);
      if (m) {
        const num = parseInt(m[1]);
        const die = parseInt(m[2]);
        const bonus = parseInt(m[4]);
        monster.hp = roll(die, num) + (isNaN(bonus) ? 0 : bonus);
      }
    }
    (monster.hp as number) -= damage;
    return damage;
  }

  @command('save', 'roll a saving throw for the given targets')
  save(dc: string | number, attribute: string, targets: string | Monster[], points?: string | number, dmgType?: string) {
    if (typeof dc === 'string') {
      dc = parseInt(dc);
    }
    if (typeof points === 'string') {
      points = parseInt(points);
    }
    if (typeof targets === 'string') {
      return targets.split(',').map((s) => {
        const i = parseInt(s);
        if (isNaN(i) || i < 0 || i >= this.encounter.length) {
          return null;
        }
        const target = this.encounter[i];
        if (target.kind === 'player') {
          return `ignoring player at index ${i}`;
        }
        const savingThrow = roll(20, Compendium.saveModifier(target, attribute));
        let damage = undefined;
        if (typeof points === 'number' && dmgType !== undefined) {
          damage = this.damageMonster(target, points, dmgType);
        }
        let suffix = '';
        if (damage !== undefined) {
          suffix = ` and takes ${damage} points of ${dmgType} damage`;
        }
        if (savingThrow >= dc) {
          return `${i} passes` + suffix;
        } else {
          return `${i} fails` + suffix;
        }
      }).join('\r\n');
    }
  }

  @command('use', 'perform action on the current entity')
  use(i: string | number) {
    if (typeof i === 'string') {
      i = parseInt(i) - 1;
    }
    const current = this.encounter[this.currentIndex];
    if (current.kind === 'player') {
      return `todo`
    }
    let actions = current.action || [];
    if (!(actions instanceof Array)) {
      actions = [actions];
    }
    const action = actions[i].text;
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
    return `I don't know how to perform "${action}"`;
  }

}

export default Context