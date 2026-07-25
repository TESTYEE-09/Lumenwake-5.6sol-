# Lumenwake

A browser-based first-person 3D narrative game where DeepSeek V4 Flash writes each story beat around the player’s current location, inventory, relationships, and previous choices. Live generation runs through Fireworks AI on the server, never from the browser.

## The game

The sun disappeared 113 years ago. Lumenwake survives under permanent artificial twilight, powered by a machine built around a stolen star. The player carries a lantern that can turn memories into reality, but every use changes what the city remembers.

The playable slice includes:

- A full start-to-ending route through a procedural low-poly 3D world
- Three meaningful branching decisions
- Multiple win states and a lose state
- Warden Ilyra and Venn the Moth Archivist, with tracked relationships
- Persistent world changes, gates, atmosphere, inventory, health, objectives, journal beats, and a minimap
- Server-side Fireworks streaming with compact story state
- DeepSeek V4 Flash through `accounts/fireworks/models/deepseek-v4-flash`
- A deterministic offline story director, so the game remains playable without an API key
- Procedural ambient music and sound effects using Web Audio, with no licensed assets

## Requirements

- Node.js 18 or newer
- A Fireworks AI API key for live-generated narrative

## Local setup

```bash
npm install
cp .env.example .env
```

Open `.env` and add your Fireworks key:

```env
FIREWORKS_API_KEY=your_key_here
FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v4-flash
PORT=8787
```

Create a key from the Fireworks AI dashboard at `https://app.fireworks.ai/`.

## Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

`npm run dev` starts both:

- Vite frontend on port 5173
- Express story server on port 8787

## Production server

```bash
npm run build
npm start
```

The Express server serves the generated `dist` folder and the `/api/story` endpoint from the same origin.

## GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. It builds and deploys the frontend whenever `main` changes.

GitHub Pages cannot run Express or safely store `FIREWORKS_API_KEY`. The Pages version therefore uses the complete browser-side offline director by default. It is still playable from start to every ending.

To connect the Pages frontend to a separately hosted backend:

1. Deploy this repository’s Express server to a Node host.
2. Add `FIREWORKS_API_KEY` to that host, not GitHub Pages.
3. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**.
4. Add `VITE_STORY_API_URL` containing the public backend origin, such as `https://lumenwake-api.example.com`.
5. Run the Pages workflow again.

Because this repository is private, GitHub Pages requires GitHub Pro, Team, or Enterprise. Alternatively, make the repository public.

## Controls

- `WASD` or arrow keys: move
- Mouse: look
- `Shift`: sprint
- `E`: interact
- Click the 3D world: capture the mouse
- Choice screens automatically release the mouse so buttons remain usable

## Story architecture

The client sends only compact running state to `/api/story`:

- Current phase and location
- Health and inventory
- NPC relationships
- Important world flags
- A short rolling summary and the last three beats

The Express server calls the Fireworks OpenAI-compatible endpoint with streaming enabled. DeepSeek V4 Flash can rewrite narration, dialogue, the current objective wording, and ambient mood. Canonical progression and effects are validated server-side, preventing malformed model output from making the game impossible to finish.

If the key is missing, the request fails, or the model returns invalid output, the server streams a local canonical beat instead. The API key never reaches the browser.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `FIREWORKS_API_KEY` | none | Server-only Fireworks key |
| `FIREWORKS_MODEL` | `accounts/fireworks/models/deepseek-v4-flash` | Fireworks model identifier |
| `FIREWORKS_OFFLINE` | `false` | Force the server’s offline fallback |
| `PORT` | `8787` | Express server port |
| `VITE_STORY_API_URL` | same origin | Public backend origin used by the frontend |

## Project structure

```text
server/
  index.js             Express API, Fireworks SSE streaming, static production hosting
  storyEngine.js       World lore, canonical beats, state compaction, validation
src/
  components/          HUD, choices, title screen, ending screen
  game/
    World.jsx          Procedural R3F world and reactive world state
    PlayerController.jsx
    audio.js           Procedural Web Audio soundtrack
    useStoryGame.js    Story state, SSE client, effects, branching, Pages fallback
  App.jsx
.github/workflows/
  deploy-pages.yml     Vite build and GitHub Pages deployment
```

## Security

- `.env` is ignored by Git
- The Fireworks key is read only by Express
- The browser calls `/api/story`, never Fireworks directly
- GitHub Pages receives no API key
- Model-generated state is restricted and merged with server-owned canonical effects
