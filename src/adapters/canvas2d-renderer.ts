import type { BrickKind } from '../domain/brick';
import { BALL_RADIUS } from '../domain/ball';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../domain/logical-size';
import { PADDLE_HEIGHT, PADDLE_Y } from '../domain/paddle';
import type { PowerUpKind } from '../domain/powerup';
import type { Session, SessionState } from '../domain/session';
import type { Viewport } from './viewport';

/** The slice of `CanvasRenderingContext2D` the renderer uses, so tests can pass a recording stub. */
export type DrawingContext = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
  | 'setTransform'
  | 'fillRect'
  | 'beginPath'
  | 'arc'
  | 'fill'
  | 'fillText'
>;

/** Placeholder palette (final art direction is out of V1 scope, GDD). */
const COLOR = {
  background: '#10131c',
  text: '#e8ecf4',
  paddle: '#4fc3f7',
  paddlePierce: '#ffd54f',
  ball: '#ffffff',
  hud: '#8c96ad',
  overlay: 'rgba(16, 19, 28, 0.72)',
} as const;

const BRICK_COLOR: Record<BrickKind, string> = {
  normal: '#66bb6a',
  strong: '#ef5350',
  unbreakable: '#78909c',
};
/** Colour of a strong brick once it has taken its first hit. */
const BRICK_DAMAGED = '#ffab91';

const POWER_UP_COLOR: Record<PowerUpKind, string> = {
  piercing: '#ffd54f',
  multiBall: '#ba68c8',
  widePaddle: '#4fc3f7',
};
const POWER_UP_LABEL: Record<PowerUpKind, string> = {
  piercing: 'P',
  multiBall: 'M',
  widePaddle: 'W',
};
const POWER_UP_HALF = 8;
const HUD_BASELINE = 12;

/** Message shown over the field for the states that wait for a tap. */
const OVERLAY_TEXT: Partial<Record<SessionState, string>> = {
  title: 'TAP TO START',
  ready: 'TAP TO LAUNCH',
  paused: 'PAUSED - TAP',
  lifeLost: 'LIFE LOST - TAP',
  levelCleared: 'LEVEL CLEARED - TAP',
  gameOver: 'GAME OVER - TAP',
  victory: 'VICTORY - TAP',
};

/**
 * Draws a session on a 2D canvas context (ADR-0001). It owns no game state; the only things it
 * caches are the HUD string and the current scale. Index loops and cached strings keep the frame
 * free of allocation.
 */
export class Canvas2DRenderer {
  private scale = 1;
  private hudScore = -1;
  private hudLives = -1;
  private hudText = '';
  private readonly context: DrawingContext;

  constructor(context: DrawingContext) {
    this.context = context;
  }

  /** Applies a new viewport scale; call after the canvas bitmap was resized. */
  resize(viewport: Viewport): void {
    this.scale = viewport.scale;
  }

  /** Draws one frame of `session`. */
  render(session: Session): void {
    const ctx = this.context;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.fillStyle = COLOR.background;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.drawBricks(session);
    this.drawPowerUps(session);
    this.drawPaddle(session);
    this.drawBalls(session);
    this.drawHud(session);
    const message = OVERLAY_TEXT[session.state];
    if (message !== undefined) this.drawOverlay(message);
  }

  private drawBricks(session: Session): void {
    const ctx = this.context;
    const bricks = session.world.bricks;
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i];
      if (brick?.alive !== true) continue;
      const damaged = brick.kind === 'strong' && brick.hp === 1;
      ctx.fillStyle = damaged ? BRICK_DAMAGED : BRICK_COLOR[brick.kind];
      const { left, top, width, height } = brick.rect;
      ctx.fillRect(left + 1, top + 1, width - 2, height - 2);
    }
  }

  private drawPowerUps(session: Session): void {
    const ctx = this.context;
    const pool = session.world.powerUps;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 10px monospace';
    for (let i = 0; i < pool.count; i++) {
      const item = pool.items[i];
      if (item === undefined) continue;
      ctx.fillStyle = POWER_UP_COLOR[item.kind];
      ctx.fillRect(
        item.x - POWER_UP_HALF,
        item.y - POWER_UP_HALF,
        POWER_UP_HALF * 2,
        POWER_UP_HALF * 2,
      );
      ctx.fillStyle = COLOR.background;
      ctx.fillText(POWER_UP_LABEL[item.kind], item.x, item.y);
    }
  }

  private drawPaddle(session: Session): void {
    const ctx = this.context;
    const { paddle, piercingLeft } = session.world;
    ctx.fillStyle = piercingLeft > 0 ? COLOR.paddlePierce : COLOR.paddle;
    ctx.fillRect(
      paddle.x - paddle.width / 2,
      PADDLE_Y - PADDLE_HEIGHT / 2,
      paddle.width,
      PADDLE_HEIGHT,
    );
  }

  private drawBalls(session: Session): void {
    const ctx = this.context;
    const pool = session.world.balls;
    ctx.fillStyle = session.world.piercingLeft > 0 ? COLOR.paddlePierce : COLOR.ball;
    for (let i = 0; i < pool.count; i++) {
      const ball = pool.items[i];
      if (ball === undefined) continue;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHud(session: Session): void {
    const ctx = this.context;
    if (session.score !== this.hudScore || session.lives !== this.hudLives) {
      this.hudScore = session.score;
      this.hudLives = session.lives;
      this.hudText = `SCORE ${String(session.score)}   LIVES ${String(session.lives)}`;
    }
    ctx.fillStyle = COLOR.hud;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.hudText, 4, LOGICAL_HEIGHT - HUD_BASELINE);
  }

  private drawOverlay(message: string): void {
    const ctx = this.context;
    ctx.fillStyle = COLOR.overlay;
    ctx.fillRect(0, LOGICAL_HEIGHT / 2 - 24, LOGICAL_WIDTH, 48);
    ctx.fillStyle = COLOR.text;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2);
  }
}
