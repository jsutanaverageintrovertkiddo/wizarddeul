export enum VisibleTurnPhase {
  // Local player has not selected a card yet; button disabled.
  endTurnDisabled = 'end turn disabled',

  // Local player has previewed a card and can end the turn.
  endTurnEnabled = 'end turn enabled',

  // It is the opponent's turn; local player cannot interact.
  opponentTurn = 'opponent turn',
}

interface EndTurnButtonProps {
  readonly turnPhase: VisibleTurnPhase;
  readonly handleEndTurnButtonClick: () => void;
  readonly isWaitingForOpponent?: boolean;
}

export const EndTurnButton = ({
  turnPhase,
  handleEndTurnButtonClick,
  isWaitingForOpponent = false,
}: EndTurnButtonProps) => {
  const buttonStyles: Record<VisibleTurnPhase, string> = {
    [VisibleTurnPhase.endTurnDisabled]: 'btn-secondary',
    [VisibleTurnPhase.endTurnEnabled]: 'btn-dark',
    [VisibleTurnPhase.opponentTurn]: 'btn-secondary',
  };

  const label =
    turnPhase === VisibleTurnPhase.opponentTurn
      ? isWaitingForOpponent
        ? 'Opponent Turn'
        : "Opponent's Turn"
      : 'End Turn';

  return (
    <div className='d-flex justify-content-end m-2'>
      <button
        className={`btn btn-lg btn-width ${buttonStyles[turnPhase]}`}
        data-testid='end-turn-button'
        onClick={handleEndTurnButtonClick}
        disabled={turnPhase !== VisibleTurnPhase.endTurnEnabled}
      >
        {label}
      </button>
    </div>
  );
};