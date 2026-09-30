import { useState } from 'react';
import { EffectType } from '../../model/cardEffects';
import { Player } from '../../model/player';
import { AnimationProps, getAvatarForPlayer, icon } from '../../utils/assetUtils';

export const AVATAR_HEIGHT = 125;
export const AVATAR_WIDTH = 125;
export const AVATAR_SMALL_SCALE = 0.9;
export const AVATAR_MEDIUM_SCALE = 1.1;

interface PlayerStatsPanelProps {
  readonly player: Player;
  readonly label: string;
  readonly showCardAnimation: boolean;
  readonly cardAnimationData?: AnimationProps;
  readonly isActiveTurn?: boolean;
}

/**
 * Reference-styled stats panel: avatar + HP/ATK/SHIELD readout, with an added
 * health bar so both duellists can read the race at a glance in online play.
 */
export const PlayerStatsPanel = ({
  player,
  label,
  showCardAnimation,
  cardAnimationData,
  isActiveTurn = false,
}: PlayerStatsPanelProps) => {
  const [isStatsIconsHovered, setIsStatsIconsHovered] = useState(false);

  const height = AVATAR_HEIGHT * AVATAR_MEDIUM_SCALE;
  const width = AVATAR_WIDTH * AVATAR_MEDIUM_SCALE;

  const hpRatio = Math.max(
    0,
    Math.min(1, player.maxHp > 0 ? player.hp / player.maxHp : 0)
  );
  const hpPercent = `${(hpRatio * 100).toFixed(1)}%`;

  const formatValueDisplay = (currentValue: number, maxValue: number): string => {
    if (currentValue >= maxValue) {
      return `${currentValue} (+${currentValue - maxValue})`;
    }
    return `${currentValue} (-${maxValue - currentValue})`;
  };

  return (
    <div
      className={`d-inline-block p-2 rounded bg-panel ${
        isActiveTurn ? 'panel-active-turn' : ''
      }`}
    >
      <div className='player-name-label mb-1' data-testid='player-name-label'>
        {label}
      </div>

      <div className='d-flex align-items-center'>
        <div
          className='me-3 position-relative'
          data-bs-toggle='tooltip'
          data-bs-placement={player.id === '0' ? 'top' : 'bottom'}
          data-bs-title={label}
        >
          <img
            src={getAvatarForPlayer(player.id)}
            alt='avatar'
            height={height}
            width={width}
          />

          {player.effects.some((e) => e.type === EffectType.freeze) && (
            <img src={icon.ice} alt='ice' className='overlay-ice' />
          )}

          {showCardAnimation && cardAnimationData && (
            <img
              src={cardAnimationData.path}
              alt={cardAnimationData.type}
              className={`vfx-${cardAnimationData.type}`}
            />
          )}
        </div>

        <div
          className='d-flex flex-column'
          data-testid='stats-container'
          onMouseEnter={() => setIsStatsIconsHovered(true)}
          onMouseLeave={() => setIsStatsIconsHovered(false)}
        >
          <div className='d-flex align-items-center mb-2'>
            <img src={icon.hp} className='me-2 pstats-icon' alt='hp' />
            <span className='fw-semibold pstats-text pstats-panel-width'>
              {player.hp}
              {isStatsIconsHovered && `/${player.maxHp}`}
            </span>
          </div>

          <div className='d-flex align-items-center mb-2'>
            <img src={icon.atk} className='me-2 pstats-icon' alt='atk' />
            <span
              className={`fw-semibold pstats-text ${
                player.atk < 0 ? 'text-danger' : ''
              }`}
            >
              {isStatsIconsHovered
                ? formatValueDisplay(player.atk, player.baseAtk)
                : player.atk}
            </span>
          </div>

          <div className='d-flex align-items-center'>
            <img src={icon.def} className='me-2 pstats-icon' alt='def' />
            <span
              className={`fw-semibold pstats-text ${
                player.def < 0 ? 'text-danger' : ''
              }`}
            >
              {isStatsIconsHovered
                ? formatValueDisplay(player.def, player.baseDef)
                : player.def}
            </span>
          </div>
        </div>
      </div>

      <div className='d-flex align-items-center mt-2'>
        <div className='hp-bar flex-grow-1'>
          <div
            className={`hp-bar-fill ${hpRatio <= 0.3 ? 'hp-bar-low' : ''}`}
            style={{ width: hpPercent }}
            data-testid='hp-bar-fill'
          />
        </div>
        <span className='ms-2 fw-semibold hp-bar-label'>
          {player.hp}/{player.maxHp}
        </span>
      </div>
    </div>
  );
};