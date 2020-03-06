import MonsterManual from '../../public/compendiums/dnd5e/Monster Manual Bestiary 2.6.0';
import GameState, { GameMode } from './GameState';
import Compendium from './Compendium';

test('adding some monsters to the encounter', () => {
  const compendium = new Compendium();
  compendium.loadData('MonsterManual', MonsterManual);
  compendium.loaded = true;
  const setState = (g: GameState) => { };
  const game = new GameState(GameMode.DM, compendium, setState);
  expect(game.encounter).toEqual([]);
  game.execute("add orc 2", undefined, undefined, undefined);
  expect(game.encounter.length).toEqual(2);
  let expectHP = game.encounter[0].status.hp - 8;
  game.execute("dmg 1 8", undefined, undefined, undefined);
  expect(game.encounter[0].status.hp).toEqual(expectHP);
  expectHP = game.encounter[0].status.hp + 8;
  game.execute("dmg 1 -8", undefined, undefined, undefined);
  expect(game.encounter[0].status.hp).toEqual(expectHP);
  expectHP = game.encounter[0].status.hp - 20;
  game.execute("dmg 1 20", undefined, undefined, undefined);
  expect(game.encounter[0].status.hp).toEqual(expectHP);

  const expectHP1 = game.encounter[0].status.hp - 20;
  const expectHP2 = game.encounter[1].status.hp - 20;
  game.execute("dmg 1,2 20", undefined, undefined, undefined);
  expect(game.encounter[0].status.hp).toEqual(expectHP1);
  expect(game.encounter[1].status.hp).toEqual(expectHP2);
});

