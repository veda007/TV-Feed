export type Screen =
  | 'welcome'
  | 'bangalore-confirm'
  | 'worlds'
  | 'discovery-appetite'
  | 'selfie'
  | 'tuning'
  | 'feed';

// Cold-start flow: Welcome → Bangalore confirm → Worlds → Discovery → Selfie → Tuning → Feed
export const SCREEN_ORDER: Screen[] = [
  'welcome',
  'bangalore-confirm',
  'worlds',
  'discovery-appetite',
  'selfie',
  'tuning',
  'feed',
];

export function isForward(from: Screen, to: Screen): boolean {
  return SCREEN_ORDER.indexOf(to) > SCREEN_ORDER.indexOf(from);
}

export type FocusDirection = 'up' | 'down' | 'left' | 'right' | 'ok' | 'back';

export function getBackTarget(screen: Screen, _questionsStarted: boolean): Screen | null {
  const exits: Partial<Record<Screen, Screen | null>> = {
    welcome: null,
    'bangalore-confirm': 'welcome',
    worlds: 'bangalore-confirm',
    'discovery-appetite': 'worlds',
    selfie: 'discovery-appetite',
    tuning: null,
    feed: null,
  };
  return exits[screen] ?? null;
}
