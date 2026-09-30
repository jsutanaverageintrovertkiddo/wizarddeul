import { Player } from '../../model/player';
import { CardType, CardView } from './CardView';

interface PlayerHandProps {
  readonly player: Player;
  readonly showEnemyHand: boolean;
  readonly handleCardClick?: (index: number) => void;
  readonly selectedIndex?: number;
  readonly interactive?: boolean;
}

export const PlayerHand = ({
  player,
  showEnemyHand,
  handleCardClick,
  selectedIndex,
  interactive = false,
}: PlayerHandProps) => {
  // The local player is always rendered from seat '0' perspective on each
  // client (the board swaps opponent/local), so `player.id === '0'` means the
  // hand belongs to the client's own wizard.
  const revealFront = showEnemyHand || player.id === '0';

  return (
    <div className='d-flex justify-content-center'>
      {player.hand.map((card, index) => (
        <div key={index} className='me-2'>
          {revealFront ? (
            <CardView
              cardType={CardType.front}
              cardId={card.id}
              cardIndex={index}
              handleCardClick={interactive ? handleCardClick : undefined}
              selected={selectedIndex === index}
            />
          ) : (
            <CardView cardType={CardType.back} playerId='1' />
          )}
        </div>
      ))}
    </div>
  );
};