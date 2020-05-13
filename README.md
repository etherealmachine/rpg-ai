# RPG.ai
RPG.ai is a new type of online tabletop RPG. It includes tools for Dungeon Masters to build and
manage procedurally generated worlds.

## Features
[ ] Upload [Tiled](https://mapeditor.org) tilesets and tilemaps.
[ ] Create unique characters, upload a token to represent your character in the campaign.
[ ] Tilemaps can have embedded room descriptions, loot, and NPC's.
[ ] Start a new encounter using a tilemap and drop in characters.
[ ] Each encounter has a [Phaser-based](https://phaser.io/) UI (see the [Encounter UI](#encounter-ui)).
[ ] Link your encounters in a Campaign, and invite other players to join.
[ ] The campaign acts as a searchable compendium across its encounters, so you can, for example,
search for an NPC by name and get a list of all the interactions with that NPC.

## Encounter UI
The encounter UI helps manage environment and NPC interactions as well as combat.

Some examples:

Opening a stuck door might have the DM call for a strength check. The player can click a button to
make their roll. Based on the roll, the DM might rule:
1. The check failed, the door is stuck fast. If the players find enough ways to modify the check
they can get it to succeed.
2. The check succeeds, but only barely. For example, if the players were trying to be quiet, they
might have busted down the door loudly, alerting nearby enemies. Part of the automation is the DM
can use a simple command to alert enemies in a radius and kickoff some simple enemy AI.
3. The check is very successful and the DM can describe how easily the might barbarian kicks open
the door.
