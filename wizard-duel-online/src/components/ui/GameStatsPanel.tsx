import { WizardDuelState } from '../../model/shared';
import { icon } from '../../utils/assetUtils';
import { CardPile } from '../card/CardPile';

interface GameStatsPanelProps {
  readonly G: WizardDuelState;
  readonly visibleTurn: number;
  readonly showGameStats: boolean;
  readonly currentPlayerLabel: string;
}

export const GameStatsPanel = ({
  G,
  visibleTurn,
  showGameStats,
  currentPlayerLabel,
}: GameStatsPanelProps) => {
  const shouldClearEffects =
    G.globalEffects.shouldClearEffects?.[visibleTurn - 1] ?? false;

  const getTurnHighlightStyle = () => {
    if (shouldClearEffects) return 'text-danger';
    return '';
  };

  return (
    <div className='d-flex flex-column'>
      <CardPile />

      {showGameStats && (
        <div className='d-inline-block p-1 mt-2 rounded bg-panel'>
          <div className='d-flex justify-content-center gstats-panel-width'>
            <div className='d-flex align-items-center me-2'>
              <img
                src={icon.level}
                alt='level'
                data-bs-toggle='tooltip'
                data-bs-placement='bottom'
                data-bs-title='Online duel'
              />
              <span className='fw-semibold'>PvP</span>
            </div>

            <div className='d-flex align-items-center me-2'>
              <img
                src={icon.turn}
                alt='turn'
                data-bs-toggle='tooltip'
                data-bs-placement='bottom'
                data-bs-title='Current turn'
              />
              <span className={`fw-semibold ${getTurnHighlightStyle()}`}>
                {visibleTurn}
              </span>
            </div>

            <div className='d-flex align-items-center'>
              <img
                src={icon.deck}
                alt='deck'
                data-bs-toggle='tooltip'
                data-bs-placement='bottom'
                data-bs-title='Cards left'
              />
              <span className='fw-semibold'>{G.deck.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className='turn-indicator mt-2' data-testid='turn-indicator'>
        <span className='turn-indicator-label'>NOW ACTING</span>
        <span className='turn-indicator-player'>{currentPlayerLabel}</span>
      </div>
    </div>
  );
};