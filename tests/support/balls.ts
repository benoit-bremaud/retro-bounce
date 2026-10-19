import { type Ball } from '../../src/domain/ball';
import { type World } from '../../src/domain/world';

/** The first ball of the world; tests with a single ball use it everywhere. */
export function firstBall(world: World): Ball {
  const ball = world.balls.items[0];
  if (ball === undefined) throw new Error('The world has no ball');
  return ball;
}
