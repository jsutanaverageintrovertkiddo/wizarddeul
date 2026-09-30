import { Modal } from './Modal';

export type DuelOutcome = 'victory' | 'defeat' | 'draw';

interface GameoverModalProps {
  readonly showGameoverModal: boolean;
  readonly outcome: DuelOutcome;
  readonly onPlayAgain: () => void;
  readonly onReturnToMenu: () => void;
}

/**
 * Result screen. Uses the reference game's modal chrome and button styling,
 * with VICTORY / DEFEAT wording for online play.
 */
export const GameoverModal = ({
  showGameoverModal,
  outcome,
  onPlayAgain,
  onReturnToMenu,
}: GameoverModalProps) => {
  const titles: Record<DuelOutcome, string> = {
    victory: 'VICTORY',
    defeat: 'DEFEAT',
    draw: 'DRAW',
  };

  const messages: Record<DuelOutcome, string> = {
    victory: 'You out-duelled your opponent and claimed the arena!',
    defeat: 'Defeated... your opponent outwitted you this time.',
    draw: 'The duel ran out of time and ends in a draw.',
  };

  const titleClass: Record<DuelOutcome, string> = {
    victory: 'result-title result-victory',
    defeat: 'result-title result-defeat',
    draw: 'result-title',
  };

  return (
    <Modal
      isOpen={showGameoverModal}
      customHeader={
        <h3
          className={`modal-title w-100 text-center font-bold ${titleClass[outcome]}`}
          data-testid='gameover-title'
        >
          {titles[outcome]}
        </h3>
      }
      footer={
        <>
          <button
            type='button'
            className='btn btn-secondary me-2'
            onClick={onReturnToMenu}
          >
            Return to Menu
          </button>

          {outcome === 'victory' && (
            <button
              type='button'
              className='btn btn-dark'
              onClick={onPlayAgain}
            >
              Play Again
            </button>
          )}
        </>
      }
    >
      <p className='ms-2 mb-4 gameover-text'>{messages[outcome]}</p>
    </Modal>
  );
};