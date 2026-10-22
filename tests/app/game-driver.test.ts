import { describe, expect, it } from 'vitest';
import { GameDriver } from '../../src/app/game-driver';

const DT = 1 / 60;

describe('GameDriver', () => {
  it('starts on the title and a tap starts the run, a second tap launches', () => {
    const driver = new GameDriver(() => 1);
    expect(driver.session.state).toBe('title');
    driver.tap();
    driver.step(DT);
    expect(driver.session.state).toBe('ready');
    driver.tap();
    driver.step(DT);
    expect(driver.session.state).toBe('playing');
  });

  it('moves the paddle towards the target', () => {
    const driver = new GameDriver(() => 1);
    driver.tap();
    driver.step(DT);
    driver.setPaddleTarget(300);
    driver.step(DT);
    expect(driver.session.world.paddle.x).toBe(300);
  });

  it('pauses on focus loss and a tap resumes', () => {
    const driver = new GameDriver(() => 1);
    driver.tap();
    driver.step(DT);
    driver.tap();
    driver.step(DT);
    driver.pause();
    expect(driver.session.state).toBe('paused');
    driver.tap();
    driver.step(DT);
    expect(driver.session.state).toBe('playing');
  });

  it('leaves the transition screens and the end screens on a tap', () => {
    const driver = new GameDriver(() => 1);
    const { session } = driver;
    session.state = 'lifeLost';
    session.lives = 0;
    driver.tap();
    driver.step(DT);
    expect(session.state).toBe('gameOver');
    driver.tap();
    driver.step(DT);
    expect(session.state).toBe('title');
    session.state = 'levelCleared';
    driver.tap();
    driver.step(DT);
    expect(session.state).toBe('ready');
    expect(session.world.levelIndex).toBe(1);
  });

  it('does not launch on the tap that leaves the title', () => {
    const driver = new GameDriver(() => 1);
    driver.tap();
    driver.step(DT);
    expect(driver.session.world.launched).toBe(false);
  });

  it('ignores a tap while playing', () => {
    const driver = new GameDriver(() => 1);
    driver.tap();
    driver.step(DT);
    driver.tap();
    driver.step(DT);
    driver.tap();
    driver.step(DT);
    expect(driver.session.state).toBe('playing');
  });

  it('draws a new seed for every new run', () => {
    let next = 0;
    const driver = new GameDriver(() => ++next);
    expect(driver.session.seed).toBe(1);
    driver.tap();
    driver.step(DT);
    expect(driver.session.seed).toBe(2);
  });

  it('restarts from victory to the title', () => {
    const driver = new GameDriver(() => 1);
    driver.session.state = 'victory';
    driver.tap();
    driver.step(DT);
    expect(driver.session.state).toBe('title');
  });
});
