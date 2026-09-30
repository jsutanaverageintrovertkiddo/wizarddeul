import { PlayerID } from 'boardgame.io';
import { CardId, getCardCount } from '../model/cards';

const imgPrefix = '/images';
const avatarPrefix = `${imgPrefix}/avatars`;
const cardPrefix = `${imgPrefix}/cards`;
const locationPrefix = `${imgPrefix}/locations`;
const animationPrefix = '/animations';
const audioPrefix = '/audio';
const musicPrefix = '/music';

// The online duel uses one fixed arcane arena.
export const ARENA_LOCATION = `${locationPrefix}/castle.png`;

const avatarPaths: Record<string, string> = {
  0: `${avatarPrefix}/player.png`,
  1: `${avatarPrefix}/wise-scholar.png`,
  2: `${avatarPrefix}/wild-firemancer.png`,
  3: `${avatarPrefix}/ice-queen.png`,
  4: `${avatarPrefix}/traveling-merchant.png`,
  5: `${avatarPrefix}/forest-ranger.png`,
  6: `${avatarPrefix}/murloc-oracle.png`,
  7: `${avatarPrefix}/crimson-witch.png`,
  8: `${avatarPrefix}/dark-knight.png`,
};

/**
 * Both seats are human wizards. Seat 0 is the player avatar; seat 1 gets a
 * matching wizard portrait so the matchup reads as duelist-vs-duelist.
 */
export const getAvatarForPlayer = (playerId: PlayerID): string =>
  playerId === '0' ? avatarPaths[0] : avatarPaths[7];

const icon: Record<string, string> = {
  hp: `${imgPrefix}/icons/hp.svg`,
  atk: `${imgPrefix}/icons/atk.svg`,
  def: `${imgPrefix}/icons/def.svg`,
  effect: `${imgPrefix}/icons/effect.svg`,
  log: `${imgPrefix}/icons/log.svg`,
  settings: `${imgPrefix}/icons/settings.svg`,
  help: `${imgPrefix}/icons/help.svg`,
  buff: `${imgPrefix}/icons/buff.svg`,
  debuff: `${imgPrefix}/icons/debuff.svg`,
  ice: `${imgPrefix}/icons/ice.svg`,
  level: `${imgPrefix}/icons/level.svg`,
  turn: `${imgPrefix}/icons/turn.svg`,
  deck: `${imgPrefix}/icons/deck.svg`,
};

const cardFront = (cardId: CardId) => `${cardPrefix}/front/${cardId}.png`;
const cardBack = (playerId: PlayerID) => `${cardPrefix}/back/${playerId}.png`;
const cardPlaceholder = (playerId: PlayerID) =>
  `${cardPrefix}/placeholder/${playerId}.png`;
const cardPile = `${cardPrefix}/pile.png`;

const cardFronts = Array.from(
  { length: getCardCount() },
  (_, cardId) => `${cardPrefix}/front/${cardId}.png`
);

// ANIMATION FILES

export enum Animation {
  fireball = 'fireball',
  freeze = 'freeze',
  thunder = 'thunder',
  heal = 'heal',
  sword = 'sword',
  shield = 'shield',
  ghostBounce = 'ghost-bounce',
  skull = 'skull',
  hammer = 'hammer',
  bloodStrike = 'blood-strike',
  bloodBurst = 'blood-burst',
  starBounce = 'star-bounce',
  starStrike = 'star-strike',
  starImpact = 'star-impact',
  slimeSwirl = 'slime-swirl',
  slimeStrike = 'slime-strike',
  waterExplode = 'water-explode',
  bloodCrossStrike = 'blood-cross-strike',
  slimeSplash = 'slime-splash',
}

export interface AnimationProps {
  readonly type: Animation;
  readonly path: string;
  readonly timeout: number;
}

const getAnimationPath = (type: string) => `${animationPrefix}/${type}.gif`;
const createAnimationProps = (
  type: Animation,
  timeout: number
): AnimationProps => ({
  type,
  path: getAnimationPath(type),
  timeout,
});

const animationData: Record<Animation, AnimationProps> = {
  [Animation.fireball]: createAnimationProps(Animation.fireball, 500),
  [Animation.freeze]: createAnimationProps(Animation.freeze, 1000),
  [Animation.thunder]: createAnimationProps(Animation.thunder, 1000),
  [Animation.heal]: createAnimationProps(Animation.heal, 500),
  [Animation.sword]: createAnimationProps(Animation.sword, 1000),
  [Animation.shield]: createAnimationProps(Animation.shield, 1200),
  [Animation.ghostBounce]: createAnimationProps(Animation.ghostBounce, 1200),
  [Animation.skull]: createAnimationProps(Animation.skull, 1800),
  [Animation.hammer]: createAnimationProps(Animation.hammer, 1000),
  [Animation.bloodStrike]: createAnimationProps(Animation.bloodStrike, 1000),
  [Animation.bloodBurst]: createAnimationProps(Animation.bloodBurst, 1000),
  [Animation.starBounce]: createAnimationProps(Animation.starBounce, 1200),
  [Animation.starStrike]: createAnimationProps(Animation.starStrike, 1000),
  [Animation.starImpact]: createAnimationProps(Animation.starImpact, 600),
  [Animation.slimeSwirl]: createAnimationProps(Animation.slimeSwirl, 1000),
  [Animation.slimeStrike]: createAnimationProps(Animation.slimeStrike, 600),
  [Animation.waterExplode]: createAnimationProps(Animation.waterExplode, 800),
  [Animation.bloodCrossStrike]: createAnimationProps(
    Animation.bloodCrossStrike,
    800
  ),
  [Animation.slimeSplash]: createAnimationProps(Animation.slimeSplash, 500),
};

export enum AnimationTarget {
  enemy = 'enemy',
  self = 'self',
  both = 'both',
  none = 'none',
}

interface CardAnimationProps {
  readonly type: Animation;
  readonly target: AnimationTarget;
}

const cardAnimation: Record<CardId, CardAnimationProps | undefined> = {
  [CardId.Fireball1]: { type: Animation.fireball, target: AnimationTarget.enemy },
  [CardId.Fireball2]: { type: Animation.fireball, target: AnimationTarget.enemy },
  [CardId.Fireball3]: { type: Animation.fireball, target: AnimationTarget.enemy },
  [CardId.Frost1]: { type: Animation.freeze, target: AnimationTarget.enemy },
  [CardId.Frost2]: { type: Animation.freeze, target: AnimationTarget.enemy },
  [CardId.Frost3]: { type: Animation.freeze, target: AnimationTarget.enemy },
  [CardId.Thunder1]: { type: Animation.thunder, target: AnimationTarget.enemy },
  [CardId.Thunder2]: { type: Animation.thunder, target: AnimationTarget.enemy },
  [CardId.Thunder3]: { type: Animation.thunder, target: AnimationTarget.enemy },
  [CardId.Heal1]: { type: Animation.heal, target: AnimationTarget.self },
  [CardId.Heal2]: { type: Animation.heal, target: AnimationTarget.self },
  [CardId.Heal3]: { type: Animation.heal, target: AnimationTarget.self },
  [CardId.Blessing]: { type: Animation.sword, target: AnimationTarget.self },
  [CardId.Armor]: { type: Animation.shield, target: AnimationTarget.self },
  [CardId.Weaken]: { type: Animation.ghostBounce, target: AnimationTarget.enemy },
  [CardId.Curse]: { type: Animation.skull, target: AnimationTarget.enemy },
  [CardId.Purify]: { type: Animation.hammer, target: AnimationTarget.self },
  [CardId.Dispel]: { type: Animation.bloodStrike, target: AnimationTarget.enemy },
  [CardId.Enrage]: { type: Animation.sword, target: AnimationTarget.self },
  [CardId.Block]: { type: Animation.shield, target: AnimationTarget.self },
  [CardId.Flame]: { type: Animation.fireball, target: AnimationTarget.enemy },
  [CardId.Resurrect]: { type: Animation.bloodBurst, target: AnimationTarget.self },
  [CardId.Petrify]: { type: Animation.freeze, target: AnimationTarget.enemy },
  [CardId.Aura]: { type: Animation.heal, target: AnimationTarget.self },
  [CardId.Sandstorm]: undefined,
  [CardId.Wish1]: undefined,
  [CardId.Wish2]: { type: Animation.starBounce, target: AnimationTarget.enemy },
  [CardId.Wish3]: { type: Animation.starStrike, target: AnimationTarget.self },
  [CardId.Wish4]: { type: Animation.starBounce, target: AnimationTarget.self },
  [CardId.Wish5]: { type: Animation.starImpact, target: AnimationTarget.enemy },
  [CardId.Mutate]: { type: Animation.slimeSwirl, target: AnimationTarget.both },
  [CardId.Ambush]: { type: Animation.slimeStrike, target: AnimationTarget.enemy },
  [CardId.Vision]: undefined,
  [CardId.Tide]: { type: Animation.waterExplode, target: AnimationTarget.enemy },
  [CardId.Revenge]: {
    type: Animation.bloodCrossStrike,
    target: AnimationTarget.self,
  },
  [CardId.Poison]: { type: Animation.slimeSplash, target: AnimationTarget.enemy },
};

export const getAnimationDataForCard = (
  cardId: CardId
): AnimationProps | undefined =>
  animationData[cardAnimation[cardId]?.type as Animation];

export const getAnimationTargetForCard = (
  cardId: CardId
): AnimationTarget | undefined =>
  cardAnimation[cardId]?.target as AnimationTarget;

// AUDIO FILES

const cardAudioType: Record<CardId, string> = {
  [CardId.Fireball1]: 'fireball',
  [CardId.Fireball2]: 'fireball',
  [CardId.Fireball3]: 'fireball',
  [CardId.Frost1]: 'freeze',
  [CardId.Frost2]: 'freeze',
  [CardId.Frost3]: 'freeze',
  [CardId.Thunder1]: 'thunder',
  [CardId.Thunder2]: 'thunder',
  [CardId.Thunder3]: 'thunder',
  [CardId.Heal1]: 'heal',
  [CardId.Heal2]: 'heal',
  [CardId.Heal3]: 'heal',
  [CardId.Blessing]: 'sword',
  [CardId.Armor]: 'shield',
  [CardId.Weaken]: 'weaken',
  [CardId.Curse]: 'weaken',
  [CardId.Purify]: 'magic',
  [CardId.Dispel]: 'magic',
  [CardId.Enrage]: 'sword',
  [CardId.Block]: 'shield',
  [CardId.Flame]: 'fireball',
  [CardId.Resurrect]: 'magic',
  [CardId.Petrify]: 'freeze',
  [CardId.Aura]: 'heal',
  [CardId.Sandstorm]: 'wind',
  [CardId.Wish1]: 'magic',
  [CardId.Wish2]: 'freeze',
  [CardId.Wish3]: 'sword',
  [CardId.Wish4]: 'heal',
  [CardId.Wish5]: 'fireball',
  [CardId.Mutate]: 'heal',
  [CardId.Ambush]: 'arrow',
  [CardId.Vision]: 'waves',
  [CardId.Tide]: 'waves',
  [CardId.Revenge]: 'roar',
  [CardId.Poison]: 'potion',
};

export const cardAudio = (cardId: CardId) =>
  `${audioPrefix}/${cardAudioType[cardId]}.mp3`;

export const click = `${audioPrefix}/click.mp3`;
export const victory = `${audioPrefix}/victory.mp3`;
export const defeat = `${audioPrefix}/defeat.mp3`;
export const miss = `${audioPrefix}/wind.mp3`;
export const defrost = `${audioPrefix}/freeze.mp3`;
export const cleanse = `${audioPrefix}/waves.mp3`;
export const potion = `${audioPrefix}/potion.mp3`;

// MUSIC FILES

export const ARENA_MUSIC = `${musicPrefix}/black-castle.mp3`;

// ALL FILES FOR PRELOAD

export const IMAGES = [
  ...Object.values(avatarPaths),
  ARENA_LOCATION,
  ...Object.values(icon),
  ...cardFronts,
  `${cardPrefix}/back/0.png`,
  `${cardPrefix}/back/1.png`,
  `${cardPrefix}/placeholder/0.png`,
  `${cardPrefix}/placeholder/1.png`,
  cardPile,
];

export const ANIMATION = Object.values(animationData).map((d) => d.path);

export const AUDIO = [
  click,
  victory,
  defeat,
  `${audioPrefix}/fireball.mp3`,
  `${audioPrefix}/freeze.mp3`,
  `${audioPrefix}/thunder.mp3`,
  `${audioPrefix}/heal.mp3`,
  `${audioPrefix}/sword.mp3`,
  `${audioPrefix}/shield.mp3`,
  `${audioPrefix}/weaken.mp3`,
  `${audioPrefix}/magic.mp3`,
  `${audioPrefix}/wind.mp3`,
  `${audioPrefix}/arrow.mp3`,
  `${audioPrefix}/waves.mp3`,
  `${audioPrefix}/roar.mp3`,
  `${audioPrefix}/potion.mp3`,
];

export const MUSIC = [ARENA_MUSIC];

export {
  icon,
  cardFront,
  cardBack,
  cardPlaceholder,
  cardPile,
  cardFronts,
};