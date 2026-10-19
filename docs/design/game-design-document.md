# retro-bounce — Game Design Document (v0.1)

Status: V1 values validated by the owner on 2026-10-19. Numbers are starting points, tuned by playtesting. Related: ADR-0001, ADR-0002, UML study in `docs/architecture/diagrams/gameplay/`.

## 1. Pitch

A solo brick-breaker (Arkanoid-style) for the browser. A paddle moves left and right at the bottom, a ball bounces off walls, paddle and bricks, and power-ups fall from broken bricks. Clear every breakable brick before losing all three lives. Mobile-first: played with a finger on a phone, also on tablet and PC.

## 2. Playfield

- Logical size **360 × 640** units, portrait, scaled to any screen and orientation (integer scale when possible, letterboxed otherwise).
- Fixed simulation step of 60 Hz. Rendering is separate from the simulation.
- Bricks sit on a grid of **10 columns**, each brick **36 × 16** units, from the top of the field. Up to 12 rows.
- The paddle moves along the bottom, centre at y = 600. Walls on the left, right and top. Bottom is open: a ball that leaves it is lost.

## 3. Ball and paddle

| Item | Value |
|---|---|
| Ball radius | 5 |
| Ball speed | 300 units/s at level 1, +5 % per level, capped at 480 |
| Paddle size | 64 × 10, 96 × 10 while "wide paddle" is active |
| Paddle keyboard speed | 420 units/s (touch is relative to the finger's movement, mouse follows the pointer's absolute x) |
| Lives | 3 |

- **Bounce on the paddle**: the horizontal hit position maps to an angle of ±60° from vertical (centre sends the ball straight up). The vertical component never falls below 35 % of the speed, so the ball cannot loop almost horizontally.
- Bounce on walls and bricks mirrors the velocity. The ball speed is constant, except across levels.
- The ball starts glued to the paddle (state Ready). A tap, Space or a click launches it upward, 10° to 20° to the left or right of vertical (angle and side drawn with the seeded generator, so a run is reproducible from its seed).
- Collisions are resolved with a swept test so a fast ball cannot cross a brick or the paddle.

## 4. Bricks

| Type | Hits | Points | Note |
|---|---|---|---|
| Normal | 1 | 10 | |
| Strong | 2 | 20 | Changes look after the first hit |
| Unbreakable | never | 0 | Not required to clear the level, a piercing ball does not cross it |

A level is cleared when no breakable brick is left.

## 5. Power-ups

Each destroyed brick has a **15 %** chance to release one. It falls at 120 units/s and is caught by touching the paddle. If it leaves the bottom it is lost, with no penalty. The kind is drawn with the seeded random generator, equal chance for each of the three.

| Power-up | Effect | Duration |
|---|---|---|
| Piercing ball (lead) | The ball goes through breakable bricks without bouncing off them, destroying each one in a single pass (a strong brick included). It still bounces off walls, paddle and unbreakable bricks | 8 s |
| Multi-ball | Each ball in play becomes 3 (two new balls at ±20° from the original), up to 6 balls in total | Until balls are lost |
| Wide paddle | Paddle width 64 → 96 | 12 s |

- Catching the same timed power-up again restarts its timer, it does not stack.
- If the last breakable brick and the last ball fall in the same step, the level counts as cleared (no life lost).
- A life is lost only when the **last** ball falls. Timed effects end when a life is lost.

## 6. Scoring

- Brick points as in section 4. A power-up caught: +50.
- Level cleared: +100 per life left.
- The best score is kept locally (section 9). No leaderboard.

## 7. Levels

Five levels, the logical grid is 10 columns wide. Outlines (exact layouts live in the level data, issue #8):

1. Four full rows of normal bricks. Teaches the bounce.
2. Pyramid with strong bricks in the centre.
3. Checkerboard, strong bricks on the lower rows.
4. Two walls of unbreakable bricks with gaps, forcing angled shots.
5. Mixed layout with all three brick types.

Clearing level 5 ends the game in Victory. Speed rises with the level (section 3).

## 8. Controls (mobile-first)

| Input | Paddle | Launch | Pause |
|---|---|---|---|
| Touch | Drag a finger in the lower half of the screen: the paddle moves by the same horizontal distance as the finger (1:1, relative), wherever the touch starts, so the finger never hides the paddle | Tap | Pause button on screen |
| Mouse | The paddle centre follows the pointer's absolute horizontal position | Click | Esc or pause button |
| Keyboard | Left/Right arrows or A/D | Space | P or Esc |

- No interaction depends on hover. Tap targets are at least 44 CSS pixels.
- The game pauses by itself when the tab or the app loses focus.

## 9. Persistence and screens

- Best score in `localStorage`, nothing else, no network. The game still plays if storage fails.
- Screens follow the session state machine: Title, Ready, Playing, Paused, LifeLost, LevelCleared, GameOver, Victory. The style of menus is copied from retro-shmup and adapted (issue #12).

## 10. Out of scope (V1)

Laser and other power-ups, enemies that descend, more than five levels, FR/EN texts, online scores, gamepad. Parked in issue #17.

## 11. Open questions

- Sound style and number of effects (issue #13).
- Final art direction: palette and brick sprites (placeholder squares first).
- Does multi-ball cap at 6 feel right on a small phone screen? Check in the mobile QA pass (issue #14).
