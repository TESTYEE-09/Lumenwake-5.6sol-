# Lumenwake: The Night Engine

A browser-based first-person 3D adventure where DeepSeek V4 Flash reacts to the player and safely changes the playable world in real time.

## The game

The last human city is no longer a city. It is **Lumenwake**, a fortress train trapped inside the same endless night while a reality-erasing storm called **The Blank** eats every route behind it.

You play a Routebreaker carrying the Atlas Key, a machine that can make described paths, objects, hazards, and people become real. The train is running out of track. Captain Mara Vey wants control, smuggler Quill Rook wants freedom, Passenger Zero claims the train has already died once, and the Night Engine is beginning to speak.

The campaign includes:

- A complete start-to-ending route built around exploration and choices
- Three major branching decisions and multiple endings
- A procedural low-poly fortress train, storm, stations, engine spaces, and generated world pieces
- Dynamic NPCs, structures, pickups, hazards, lights, weather, routes, and interactions
- Health, inventory, relationships, objectives, a journal, a minimap, and visible world-state changes
- Procedural music and sound effects with no licensed assets
- A full offline fallback campaign when live generation is unavailable

## Live runtime world director

DeepSeek does not execute arbitrary JavaScript or rewrite the React application while it is running. Instead, it returns a restricted set of **world operations** that the game validates before applying.

Supported operations include:

- Spawn or transform structures
- Spawn NPCs with names and roles
- Add pickups and interactable objects
- Create damaging hazards and collision boundaries
- Change lighting, weather, and ambience
- Add journal entries and optional interactions
- Remove previously generated entities

Every operation is clamped to safe positions, sizes, counts, behaviours, and action identifiers. Invalid output is discarded, and canonical progression remains available so a generated response cannot permanently break the playthrough.

## Fireworks and DeepSeek

Live generation uses Fireworks AI with:

```text
accounts/fireworks/models/deepseek-v4-flash
```

On GitHub Pages, the game asks for the player’s own Fireworks API key on first launch. The key is stored in that browser’s local storage and sent directly from the browser to Fireworks. It is not committed to the repository.

Do not save a key on a shared device. A browser-entered key is visible to the person controlling that browser and its developer tools. For stronger key isolation, deploy the included Express backend and keep `FIREWORKS_API_KEY` only on that server.

## Local setup

Requirements:

- Node.js 18 or newer
- A Fireworks API key for live generation, or offline mode

```bash
npm install
cp .env.example .env
npm run dev
```

For the server-side setup, place this in `.env`:

```env
FIREWORKS_API_KEY=your_key_here
FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v4-flash
PORT=8787
```

Open `http://localhost:5173`.

## Production

```bash
npm run build
npm start
```

The Express server serves the built frontend and `/api/story` from the same origin.

## GitHub Pages

The Pages workflow in `.github/workflows/deploy-pages.yml` builds and publishes the frontend whenever `main` changes.

The hosted game works in two modes:

1. Enter a personal Fireworks key to enable live DeepSeek narrative and runtime world generation.
2. Choose offline mode to play the complete authored fallback campaign.

A separately hosted Express backend can be connected by adding a repository Actions variable named `VITE_STORY_API_URL` containing the backend origin.

## Controls

- `WASD` or arrow keys: move
- Mouse: look
- `Shift`: sprint
- `E`: interact
- Click the world: capture the mouse
- Choice screens release the mouse automatically

## Project structure

```text
server/
  index.js             Express API, Fireworks streaming, production hosting
  storyEngine.js       Campaign, prompts, validation, canonical fallback
src/
  components/          HUD, title, key, choice, and ending screens
  game/
    World.jsx          Fortress-train world and runtime entity renderer
    runtimeWorld.js    Validated world-operation state and colliders
    PlayerController.jsx
    useStoryGame.js    Story, choices, Fireworks streaming, effects, runtime state
    audio.js           Procedural Web Audio soundtrack
  App.jsx
  styles.css
  runtime-world.css
```

## Safety and reliability

- `.env` is ignored by Git
- Server deployments keep their Fireworks key server-side
- Pages keys are stored only in the player’s browser
- Model-generated world operations are allow-listed and validated
- Entity counts, coordinates, scale, damage, text, and action IDs are limited
- The model cannot access the DOM or execute generated JavaScript
- Invalid or unavailable live responses fall back to the complete local director
