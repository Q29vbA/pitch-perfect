# Pitch Perfect

> **Honest disclaimer:** This project was built in about an hour. I had never touched React or TypeScript before. The entire thing is pure AI - I came up with the idea, Claude generated a precise, technical, edge-case-aware prompt (honestly, Claude wrote the spec more than I did), and then Claude Opus 4.6 wrote all the code in one shot. No back-and-forth, no debugging sessions, no stack overflow tabs. It's pretty insane

<details>
<summary><strong>Original Build Prompt</strong></summary>

Project: "Pitch Perfect" - A Frequency Discrimination Game

Build a complete React + Vite web app called Pitch Perfect. The game trains and tests the user's ability to distinguish which of two tones is higher in pitch. Deploy target is GitHub Pages. Below are all specs - follow them precisely.

---

### Stack & Setup

- React + Vite (TypeScript optional but welcome)
- No backend whatsoever - everything runs client-side
- Tailwind CSS for styling
- Deploy via `gh-pages` npm package (`npm run deploy` should build and push to the `gh-pages` branch)
- Add a `vite.config` base path set to `"/pitch-perfect/"`
- Include a clean `README.md` with: what the game is, how to run locally (`npm install && npm run dev`), and the live GitHub Pages link placeholder

---

### Audio Engine

- Use the Web Audio API exclusively - no audio files, no libraries
- Tones are pure sine waves generated with `OscillatorNode`
- Each tone plays for exactly 1.2 seconds with a 50ms fade-in and 80ms fade-out using a `GainNode` envelope (to avoid clicks/pops)
- Gap between tone A and tone B: 600ms of silence
- Base frequency: randomly chosen each round from the range 180Hz-600Hz (so rounds feel varied)
- The two tones differ by exactly N cents, where N is the current level's difficulty value
- Frequency of the higher tone = baseFreq * 2^(cents/1200) - this is the correct musical formula
- Which tone plays first (the higher or the lower) is randomized each round
- The player is told "Tone 1" and "Tone 2" - they must identify which was higher

---

### Difficulty Curve

- Difficulty is measured in cents (not Hz). 1200 cents = 1 octave.
- Level progression (cent differences per level):
    300, 240, 190, 150, 120, 100, 80, 65, 50, 40, 30, 22, 15, 10, 7, 5
- That's 16 levels - from very obvious (a minor third) down to nearly imperceptible
- Display the current level number to the player, but NOT the cent value (keep it mysterious)

---

### Lives System

- Player starts with 3 lives, displayed as filled/empty icons (unicode ears or hearts)
- Lives carry across all levels - a life is lost whenever the player answers incorrectly
- On a wrong answer: show brief feedback ("Wrong - that was Tone X"), subtract a life, then after 1.5s stay on the same level and generate a new pair of tones
- On a correct answer: show brief feedback ("Correct!"), then after 1s advance to the next level
- When all 3 lives are lost: trigger the End Screen
- If the player clears all 16 levels: also trigger the End Screen (as a win state)

---

### UI / UX - Dark Mode Audiophile Aesthetic

- Background: near-black (#0f0f0f or similar)
- Accent color: electric teal (#00d4b4 or similar) for active elements
- Typography: Inter or DM Sans from Google Fonts - clean, modern, slightly technical
- No gradients, no noise textures, no decorative flourishes - minimal and precise
- Layout is mobile-first, works perfectly on phone screens (large tap targets, nothing cramped)

Game screen contains:
- Top bar: level indicator (e.g. "Level 7 / 16") + 3 life icons
- Center: a waveform visualizer - a live animated sine wave using a Canvas element and AnalyserNode from Web Audio. It should pulse and animate while a tone is playing, and flatline (or gently idle) when silent
- A "Play" button to trigger the two-tone sequence. After pressing, it becomes disabled and shows "Playing..." until both tones finish
- After both tones finish: two large buttons appear - "Tone 1 was higher" and "Tone 2 was higher"
- A small "Replay" link/button that replays the sequence. Only available after the first play and before the answer is submitted
- Feedback shown inline (not a modal) - short colored message below the buttons: green for correct, red for wrong
- Smooth CSS transitions between states (playing -> answering -> feedback -> next round)

---

### End Screen

- Show whether the player won (cleared all levels) or ran out of lives
- Show the best level reached (e.g. "You reached Level 12")
- Show the smallest cent difference they answered correctly (e.g. "You can distinguish tones as close as 22 cents apart")
- Show a percentile framing - hardcode this lookup table:
    - 300 cents -> top 100%
    - 150 cents -> top 85%
    - 100 cents -> top 70%
    - 65 cents -> top 55%
    - 40 cents -> top 40%
    - 22 cents -> top 25%
    - 10 cents -> top 12%
    - 5 cents -> top 4%
    Use nearest match for values in between.
- Show a Share button that copies this to clipboard (with "Copied!" confirmation):

    Pitch Perfect
    I can distinguish tones as close as [X] cents apart - better than [Y]% of people!
    My best level: [N] / 16
    Try it yourself -> https://q29vba.github.io/pitch-perfect/

- Show a "Play Again" button that resets to Level 1 with 3 lives

---

### File Structure

src/
    App.tsx (or App.jsx)
    components/
        GameScreen.tsx
        EndScreen.tsx
        WaveformVisualizer.tsx
    hooks/
        useAudioEngine.ts   <- all Web Audio API logic lives here
    utils/
        difficulty.ts       <- levels array, cents->percentile lookup

---

### Edge Cases to Handle

- iOS Safari requires AudioContext to be resumed on user gesture - handle this explicitly (resume on the first Play button tap)
- Prevent double-tapping Play during playback
- If the browser doesn't support Web Audio API, show a friendly error message
- The Share button should fall back to prompt() with the pre-filled text if clipboard API is unavailable

---

### What NOT to do

- No backend, no API calls, no database
- No external audio files
- No React Native - this is a web app
- Don't use any UI component library (no MUI, no shadcn) - write the styling with Tailwind directly so it looks custom
- Don't make it a PWA - keep scope tight

</details>

A frequency discrimination game that trains and tests your ability to distinguish which of two tones is higher in pitch. Built with React, Vite, and the Web Audio API - no audio files, no libraries, no backend.

## How It Works

- Listen to two pure sine-wave tones and identify which was higher
- Progress through 16 levels of increasing difficulty
- Difficulty is measured in **cents** (a musical unit - 1200 cents = one octave), hidden from the player
- You have 3 lives across all levels. Wrong answers cost a life; lose them all and the game ends
- Clear all 16 levels to win

## Run Locally

```bash
npm install && npm run dev
```

Then open [http://localhost:5173/pitch-perfect/](http://localhost:5173/pitch-perfect/)

## Deploy to GitHub Pages

```bash
npm run deploy
```

Builds the app and pushes the `dist/` folder to the `gh-pages` branch. The Vite config sets `base: '/pitch-perfect/'` so all asset paths resolve correctly under the GitHub Pages subdirectory.

## Live

[https://q29vba.github.io/pitch-perfect/](https://q29vba.github.io/pitch-perfect/)

---

## Under the Hood

### Audio: how tones are generated

There are zero audio files in this project. Every sound is synthesized live using the browser's **Web Audio API**.

The signal chain for each tone:

```
OscillatorNode (sine wave) → GainNode (volume envelope) → AnalyserNode → destination (speakers)
```

- **OscillatorNode** produces a pure sine wave at a given frequency. `type = 'sine'` means no harmonics - just the fundamental frequency, which is what makes pitch discrimination hard at small differences.
- **GainNode** shapes the amplitude over time to avoid click/pop artefacts at the start and end of each tone. The envelope is: 0 → full volume over 50 ms (fade-in), hold, full → 0 over 80 ms (fade-out). Without this, abrupt amplitude changes cause audible clicks.
- **AnalyserNode** sits in the chain so the visualizer can read waveform data in real time without affecting the audio output.

The frequency of the higher tone is calculated with the correct musical formula:

```
higherFreq = baseFreq × 2^(cents / 1200)
```

This is logarithmic - the same number of cents always represents the same *perceptual* interval regardless of the base frequency, which is why it's the right unit for this kind of test.

Each round picks a fresh `baseFreq` at random from 180–600 Hz, so you can't anchor on a familiar pitch.

### Game state machine

`GameScreen` runs a four-phase cycle managed with a single `phase` state:

```
idle → playing → answering → feedback → idle (next round)
```

- **idle** - waiting for the player to press Play
- **playing** - audio is running; Play is disabled; answer buttons are hidden
- **answering** - audio has finished; answer buttons and Replay are shown
- **feedback** - answer was submitted; result is displayed; buttons are locked for 1–1.5 s before transitioning

The `roundRef` stores `{ higherFirst }` - which tone was actually higher - so the answer check is a single boolean comparison. It's a ref (not state) because it doesn't need to trigger a re-render; it just needs to be readable synchronously when the player taps.

### Difficulty curve

The 16 levels correspond to these cent differences:

| Level | Cents | Rough interval |
|-------|-------|----------------|
| 1 | 300 | minor third |
| 2 | 240 | - |
| 3 | 190 | - |
| 4 | 150 | major second |
| 5 | 120 | - |
| 6 | 100 | - |
| 7 | 80 | - |
| 8 | 65 | - |
| 9 | 50 | - |
| 10 | 40 | - |
| 11 | 30 | - |
| 12 | 22 | - |
| 13 | 15 | - |
| 14 | 10 | - |
| 15 | 7 | - |
| 16 | 5 | nearly imperceptible |

The cent values are intentionally hidden in the UI - showing "Level 7" instead of "80 cents" keeps it from feeling like a maths test.

### Waveform visualizer

`WaveformVisualizer` renders a `<canvas>` element and drives it with `requestAnimationFrame`. Two modes:

- **Playing:** calls `analyser.getByteTimeDomainData()` every frame to get the raw waveform buffer (2048 samples) and draws it as a polyline with a teal glow.
- **Idle:** draws a gentle, slowly drifting sine wave at low opacity - purely cosmetic, using `Math.sin` with a phase offset incremented each frame.

The canvas is sized via `getBoundingClientRect()` + `devicePixelRatio` so it's crisp on high-DPI screens.

### Percentile lookup

`centsToPercentile` in `difficulty.ts` maps the player's best cent value to a population percentile using a hardcoded reference table (e.g. 22 cents → top 25%). For values that don't appear exactly in the table, it finds the nearest entry by absolute distance.

### iOS Safari quirk

iOS requires that an `AudioContext` be created *and resumed* inside a synchronous user-gesture handler. The hook handles this by:
1. Lazily creating the `AudioContext` on the first call to `play()` (which is always triggered by a button tap)
2. Immediately calling `ctx.resume()` if the context was auto-suspended

---

## Folder Structure

```
pitch-perfect/
├── index.html                  # Entry HTML - adds Google Fonts (Inter), sets title
├── vite.config.ts              # Vite config - base path, React plugin, Tailwind plugin
├── package.json                # Scripts: dev, build, predeploy, deploy (gh-pages)
└── src/
    ├── main.tsx                # React root - mounts <App /> into #root
    ├── index.css               # Global styles - Tailwind import + CSS theme variables
    ├── App.tsx                 # Root component - toggles between GameScreen / EndScreen
    ├── components/
    │   ├── GameScreen.tsx      # Main gameplay UI and state machine
    │   ├── EndScreen.tsx       # Results screen - stats, percentile, share, play again
    │   └── WaveformVisualizer.tsx  # Canvas waveform - live analyser data or idle animation
    ├── hooks/
    │   └── useAudioEngine.ts   # All Web Audio API logic - oscillators, envelopes, analyser
    └── utils/
        └── difficulty.ts       # LEVELS array + centsToPercentile lookup
```
