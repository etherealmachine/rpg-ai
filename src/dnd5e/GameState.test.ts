import MonsterManual from '../../public/compendiums/dnd5e/Monster Manual Bestiary 2.6.0';
import GameState, { GameMode } from './GameState';
import Compendium from './Compendium';

test('adding some monsters to the encounter and doing damage', () => {
  const compendium = new Compendium();
  compendium.loadData('MonsterManual', MonsterManual);
  compendium.loaded = true;
  const setState = (g: GameState) => { };
  const game = new GameState(GameMode.DM, compendium, setState);
  game.execute("add orc 2");
  const [hp1, hp2] = [
    game.encounter[0].status.hp,
    game.encounter[1].status.hp,
  ];
  game.execute("dmg 1 8");
  game.execute("dmg 1 -4");
  game.execute("dmg 1 20");
  game.execute("dmg 1,2 -2");
  expect(game.encounter[0].status.hp).toEqual(hp1 - 8 + 4 - 20 + 2);
  expect(game.encounter[1].status.hp).toEqual(hp2 + 2);
});

test('adding some monsters and running various commands', async () => {
  const stdout = {
    write: (buf: string) => null,
  };
  const compendium = new Compendium();
  compendium.loadData('MonsterManual', MonsterManual);
  compendium.loaded = true;
  const setState = (g: GameState) => { };
  const game = new GameState(GameMode.DM, compendium, setState);
  game.stdout = stdout;
  game.stderr = stdout;
  game.execute("add orc 2");
  game.execute("add troll 1");
  game.execute("player House 4");
  game.execute("player Applewhite 3");

  const vals = ["15", "30"];
  game.stdin = {
    read: () => Promise.resolve(vals.shift()),
  };
  await game.execute("init");
  expect(game.encounter.find((m) => m.name === 'House').status.initiative).toEqual(15);
  expect(game.encounter.find((m) => m.name === 'Applewhite').status.initiative).toEqual(30);

  game.execute("rm 1");
  expect(game.encounter.find((m) => m.name === 'Applewhite')).toBeFalsy();
});
