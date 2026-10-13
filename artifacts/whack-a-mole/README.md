# Whack-a-mole

A quick browser reflex game. Choose a difficulty and a round length, then catch as many pop-up animals as you can before time runs out.

## How to play

1. Choose Easy, Medium, Hard, or Expert.
2. Choose a 30- or 60-second round.
3. Start the game and hit an animal as soon as it appears in one of the holes.

Each successful hit is worth 10 points. Targets appear briefly, and the pace increases as the round continues.

### Controls

- **Desktop:** Click an active hole or press **1–9** for the matching hole.
- **Mobile:** Tap the active animal.

Your personal best is saved in your browser.

## Settings

Open Settings with the gear button to choose which character appears: Mole, Bunny, Cat, Frog, or Fox. The selected animal is saved in the current browser.

Use the sound button to toggle sound effects and the sun/moon button to switch between dark and light mode. Dark mode is on by default.

**Reset all data** asks for confirmation before deleting the personal best and saved animal, sound, and theme preferences. Confirming ends the current round and cannot be undone.

## Run locally

From the workspace root:

```sh
pnpm install
pnpm --filter @workspace/whack-a-mole run dev
```

Other useful commands:

```sh
pnpm --filter @workspace/whack-a-mole run typecheck
pnpm --filter @workspace/whack-a-mole run build
pnpm --filter @workspace/whack-a-mole run serve
```

## Credits

Made by [olympus-mons26](https://github.com/olympus-mons26/whack-a-mole).

Thank you to [Surge](https://surge.sh) for free web hosting.

