## Life Journey: Digital Life – Game Framework Overview

### 1. High-Level Concept

- **Genre**: Nintendo Switch–style life simulation / board-life game.
- **Core Fantasy**: Spin through a full digital life from early childhood to legacy, making trade-off decisions under visible stats (HUD blood bars) and hidden psychological metrics, then receive an AI-driven Life Reflection Report.
- **Main Loop**:
  1. **Choose Dream Card** (onboarding baseline).
  2. **Spin Life Wheel** to advance time and trigger scenarios.
  3. **Answer a 4-option scenario** (popup question card).
  4. **Watch immediate stat changes + Haggard/Scandal visuals**.
  5. **Repeat across stages** until turns run out, then get **Ending + Report**.

---

### 2. Core Game Objects & State

#### 2.1 Attributes & Life Status

Defined in `src/engine/types.ts` and implemented in `PlayerState`:

- **Attributes** (`Attributes`):
  - `I` – **Intelligence**: academic / analytical capability.
  - `R` – **Physical**: stamina, body strength, health reserve.
  - `A` – **Inspiration**: creativity, artistic drive.
  - `L` – **Luck**: probability modifiers and branching events.

- **Life Status** (`LifeStatus`):
  - `money` – **Economic capital** across life.
  - `stress` – Current stress / burnout level.
  - `happiness` – Overall life satisfaction.
  - `integrity` – Moral / ethical track record.

#### 2.2 Hidden Metrics

- **RIASEC Vector** (`RiasecVector`):
  - `R, I, A, S, E, C` – standard Holland codes, accumulated from scenario choices.
- **Consistency Score (CS)**:
  - Measures how consistently the player behaves relative to their **Dream Card** and favored RIASEC axes.
  - Increased by decisions aligned with dream RIASEC and integrity gains; reduced by misalignment and scandals.
- **Scandal Value**:
  - Accumulates ethical violations and explicit scandal triggers.
  - Drives **Scandal Warning** HUD state and “fallen” endings.

#### 2.3 PlayerState Class

File: `src/engine/playerState.ts`

- **Responsibilities**:
  - Hold all mutable game stats.
  - Apply attribute / life status / RIASEC deltas from scenario outcomes.
  - Maintain **stage**, **turnsRemaining**, **haggard** and **scandal** visual states.

- **Key methods**:
  - `applyAttributes(delta)` – clamps each attribute to ≥ 0.
  - `applyLifeStatus(delta)` – clamps life-status values to ≥ 0.
  - `applyRiasec(delta)` – builds long-term RIASEC profile.
  - `applyConsistency(delta)` – evolves `hidden.consistencyScore`.
  - `applyScandal(delta)` – increases `hidden.scandalValue` and updates scandal level:
    - `< 40` → `"none"`, `40–99` → `"warning"`, `≥ 100` → `"max"`.
  - `updateHaggard()` – sets `"haggard"` when stress is high and/or physical is low.
  - `endTurn()` – decreases `turnsRemaining`, re-evaluates **stage** and **Haggard/Scandal** flags.

#### 2.4 GameEngine Class

File: `src/engine/gameEngine.ts`

- **Responsibilities**:
  - Orchestrate turns, scenario resolution, and ending evaluation.
  - Own a `PlayerState` and a `ScenarioDataHandler`.

- **Key APIs**:
  - `spinLifeWheel()` – returns a 1–6 roll (used only for UI feedback).
  - `nextScenario()` – selects the next scenario based on current stage and unseen IDs.
  - `resolveScenario(scenarioId, optionId)`:
    - Validates requirements (min attributes / life status).
    - Applies attribute / status / RIASEC / scandal deltas.
    - Calls **Consistency Scoring** (see below).
    - Advances turn and logs a `ScenarioResult` entry.
  - `getEndingScore()` – computes scalar `EndingScore` using the history (see §3.3).
  - `evaluateEnding()` – chooses one of the 20+ endings based on thresholds:
    - e.g. **Tired Billionaire**: `money > 1,000,000` & `happiness < 30`.
    - **Legendary Research Founder**: `I > 90` plus “Legend” triggers.
    - Deeply uses integrity, scandal, RIASEC, and stress patterns.
  - `generateLifeReflectionReport()` – packs:
    - Final Ending (id, title, description).
    - EndingScore.
    - Final RIASEC vector.
    - Per-stage scenario counts for reflection.

---

### 3. AI Consistency & Ending Score

#### 3.1 Dream Card Baseline

File: `GameScreen.tsx` (UI) and `consistency.ts`.

- Player chooses a **Dream Card**:
  - `surgeon` – `primaryRiasec: "I"`, `secondary: "S"`.
  - `artist` – `primary: "A"`, `secondary: "S"`.
  - `founder` – `primary: "E"`, `secondary: "I"`.
- Dream Card sets the **ideal behavioral direction**:
  - Intelligence-driven altruist, art-driven empath, or status/economy-driven innovator.

#### 3.2 Consistency Scoring Function

File: `src/engine/consistency.ts`

```ts
scoreConsistency(dreamCard, effect) -> { delta, scandalPenalty, notes }
```

- Inputs:
  - `dreamCard` – chosen baseline RIASEC axes.
  - `effect` – `OptionEffect` from the scenario option:
    - RIASEC deltas: `effect.riasec`.
    - Integrity changes: `effect.lifeStatus?.integrity`.
    - Scandal triggers: `effect.triggers?.scandal`, `effect.scandalDelta`.
    - Optional `consistencyWeight`.
- Logic:
  - Reward **primary** RIASEC gains (`RIASC_WEIGHT`) and **secondary** gains.
  - Reward **integrity** gain.
  - Apply **ScandalPenalty** when options mark `triggers.scandal`.
  - Add “legend” bonus if `triggers.legend` is set (e.g. re-doing an experiment properly).
  - Multiply by `consistencyWeight` when specified (late-life reflection choices).
  - Clamp per-decision `delta` into [-30, +30].

#### 3.3 EndingScore Formula

- As given in report:

  \[
  EndingScore = \sum (DecisionWeights \times ConsistencyFactor) - ScandalPenalty
  \]

- Implementation:
  - For each `ScenarioResult` in history:
    - Weight = `option.effect.consistencyWeight` (default 1).
    - ConsistencyFactor = `reflection.consistencyDelta`.
    - ScandalPenalty = `reflection.scandalPenalty`.
  - Sum across all decisions, clamp to [-500, 500].

---

### 4. Scenario & Content System

#### 4.1 Scenario Data Structures

File: `src/engine/types.ts`

- **Scenario**:
  - `id` – unique ID (e.g. `"1-3"` for Stage 1, index 3).
  - `stage` – `1`–`5` (Stages 1–5 of life).
  - `title`, `description`.
  - `options` – exactly four `ScenarioOption`s.
  - Optional `requirements`:
    - `minAttributes` (e.g. `I >= 50` for Medicine major).
    - `minLifeStatus` (e.g. money threshold).

- **ScenarioOption**:
  - `id` – `"A" | "B" | "C" | "D"`.
  - `label` – button text.
  - `effect` – `OptionEffect`:
    - `attributes`: partial `Attributes` delta.
    - `lifeStatus`: partial `LifeStatus` delta.
    - `riasec`: partial `RiasecVector` delta.
    - `consistencyWeight?: number`.
    - `scandalDelta?: number`.
    - `triggers?: { scandal?: boolean; haggard?: boolean; legend?: boolean }`.
    - `notes?: string` (e.g. “Luck path”, “Legend Trigger”).

#### 4.2 Scenario Data Handler

File: `src/engine/scenarioHandler.ts` and `src/data/scenarios.ts`

- `ScenarioDataHandler`:
  - Holds the full `SCENARIOS` array (Stages 1–5).
  - `getByStage(stage)` – returns all scenarios in a stage.
  - `getScenarioById(id)` – lookup.
  - `pickNextScenario(stage, seenSet)` – stage-filtered random pick of unseen scenario.

- `SCENARIOS`:
  - Encodes ~50 scenarios across 5 stages based on the report:
    - Stage 1: **Infancy–Elementary** (10 scenarios).
    - Stage 2: **Teen Exploration** (8 scenarios).
    - Stage 3: **Early Career** (10 scenarios).
    - Stage 4: **Career Maintenance / Midlife** (12 scenarios).
    - Stage 5: **Final Stage / Legacy** (10 scenarios).
  - Each scenario’s four choices map to:
    - Different RIASEC pushes and attribute/life-status trade-offs.
    - Ethics and scandal hooks tied to later “Scandal” and “Legend” endings.

---

### 5. Front-End UI & Interaction

#### 5.1 HUD & Left Panel

File: `src/ui/components/GameScreen.tsx` & `HudBars.tsx`

- **Header**:
  - Title: “Life Journey: Digital Life”.
  - Subtitle: “Nintendo Switch-inspired life simulation”.
  - **Dream Card Selector** + `Restart` button.

- **HUD Blood Bars**:
  - Implemented via `HudBars` and CSS gradients.
  - Shows four Attributes and four Life Status values as rounded “blood bars”.
  - Label + numeric value, with ellipsis when labels are long.

- **Status Panel**:
  - Stage number.
  - Remaining turns.
  - Consistency score.
  - Scandal value.

#### 5.2 Life Wheel

File: `src/ui/components/LifeWheel.tsx`

- **Visual**:
  - Circular colorful wheel with six segments.
  - Top pointer shows “selected” segment after spin.
  - No numbers on the wheel surface; only text result.

- **Behavior**:
  - Button: **Spin Life Wheel**.
  - On click:
    - Calls `onSpin()` (engine roll).
    - Wheel rotates several full turns, then eases to the rolled segment.
  - Text feedback:
    - Before first spin: “Ready to spin”.
    - After spin: “Rolled: N”.

#### 5.3 Scenario Popup (Question Card)

File: `src/ui/components/ScenarioCard.tsx` & `GameScreen.tsx`

- **Flow**:
  - When a new scenario is ready, `scenario` is set in `GameScreen`.
  - A **modal popup** overlay appears (`scenario-popup-overlay`).
  - Center card shows:
    - Scenario title and description.
    - Four option buttons (A–D) with locks where requirements fail.
  - On selection:
    - `handleOptionPick(optionId)` resolves the scenario in `GameEngine`.
    - Stats/HUD update; scenario history is logged.
    - The popup either disappears or transitions to the next scenario (as determined by engine).

#### 5.4 Map, Flags, and Movable Piece

File: `src/ui/components/MapWithMarkers.tsx` & `styles.css`

- **Map Rendering**:
  - Board image taken from `public/Map_hk.jpeg`.
  - Wrapped in `map-image-wrapper` with an overlay layer (`map-overlay`).

- **Start & Goal Flags**:
  - **Green flag** (`start`):
    - Located at the **central yellow circle** (mid-path) using the first point in `PATH`.
  - **Red flag** (`goal`):
    - Located near the big **Goal circle** using the last point in `PATH`.
  - Both flags:
    - Positioned so the **pole base** visually “touches” the path.

- **Green Movable Dot**:
  - Round marker the player can **drag along the path**.
  - Constrained to the nearest point on a polyline `PATH` defined in percentage coordinates.
  - Represents the player’s current board position relative to Start & Goal.

---

### 6. Game Flow Summary (Player Experience)

1. **Onboarding**:
   - Launch game.
   - Choose **Dream Card** (e.g. Surgeon / Artist / Founder).
   - HUD and RIASEC baseline are initialized from defaults.

2. **Main Loop**:
   - Observe **HUD Blood Bars**, **Stage**, **Turns**, **Consistency**, **Scandal**.
   - Press **Spin Life Wheel**:
     - Wheel spins and lands on a number.
     - Engine advances time and selects a suitable scenario for current stage.
   - A **Scenario Popup** appears:
     - Read the life situation.
     - Choose among four options (A–D), each with different impacts.
     - Stats animate; Haggard/Scandal states may update.
     - Green dot on the map can be dragged along the path to visualize progress.

3. **Stage Progression**:
   - As turns pass, the game automatically moves across life stages:
     - Stage 1 → Stage 2 → … → Stage 5.
   - Scenario pools change accordingly (childhood, youth, career, midlife, legacy).

4. **Action–Outcome–Reflection Loop**:
   - **Action**: scenario choice.
   - **Outcome**: immediate stat changes + hidden metric updates.
   - **Reflection** (end of run):
     - The **Life Reflection Report** shows:
       - The resulting **Ending** (out of the 20+).
       - Final **EndingScore**.
       - RIASEC profile and consistency patterns.
       - Stage-by-stage summary of decision density.

5. **Replayability**:
   - Different Dream Cards, paths, and ethical choices lead to:
     - Different **endings** (Legendary Founder, Tired Billionaire, Ghost in the System, etc.).
     - Different RIASEC shapes and consistency histories.
   - The system is designed for students/players to **test-run** alternate lives before making real-world decisions.

---

### 7. How to Extend

- **Add New Scenarios**:
  - Append to `SCENARIOS` in `src/data/scenarios.ts` with proper stage and effects.
- **Tune Endings**:
  - Adjust thresholds and logic in `GameEngine.evaluateEnding()`.
- **Adjust Map Path**:
  - Modify `PATH` array in `MapWithMarkers.tsx` to better match a new board image.
- **New Dream Cards**:
  - Add DreamCard presets in `GameScreen.tsx` and tune RIASEC / consistency weights accordingly.

