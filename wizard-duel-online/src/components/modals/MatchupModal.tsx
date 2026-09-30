import { getAvatarForPlayer } from '../../utils/assetUtils';
import {
  AVATAR_HEIGHT,
  AVATAR_SMALL_SCALE,
  AVATAR_WIDTH,
} from '../ui/PlayerStatsPanel';
import { Modal } from './Modal';

interface MatchupModalProps {
  readonly showMatchupModal: boolean;
  readonly setShowMatchupModal: React.Dispatch<React.SetStateAction<boolean>>;
  readonly playMusic: () => void;
  readonly localName: string;
  readonly opponentName: string;
  readonly scale?: number;
}

/**
 * Pre-battle matchup card, matching the reference game's "VS" presentation.
 * Both sides are human wizards here, so both avatars are duelist portraits.
 */
export const MatchupModal = ({
  showMatchupModal,
  setShowMatchupModal,
  playMusic,
  localName,
  opponentName,
  scale = AVATAR_SMALL_SCALE,
}: MatchupModalProps) => {
  const handleMatchupClose = () => {
    setShowMatchupModal(false);
    playMusic();
  };

  const height = AVATAR_HEIGHT * scale;
  const width = AVATAR_WIDTH * scale;

  return (
    <Modal
      title='Online Duel'
      isOpen={showMatchupModal}
      onBackdropClick={handleMatchupClose}
      footer={
        <button type='button' className='btn btn-dark' onClick={handleMatchupClose}>
          Begin Duel
        </button>
      }
    >
      <div className='d-flex justify-content-evenly align-items-center'>
        <div className='text-center'>
          <img
            src={getAvatarForPlayer('0')}
            alt='player-avatar'
            height={height}
            width={width}
          />
          <p className='mt-2 fw-bold'>{localName} (You)</p>
        </div>

        <h5 className='mb-5'>VS</h5>

        <div className='text-center'>
          <img
            src={getAvatarForPlayer('1')}
            alt='enemy-avatar'
            height={height}
            width={width}
          />
          <p className='mt-2 fw-bold'>{opponentName}</p>
        </div>
      </div>

      <div className='w-80 mx-auto mt-2'>
        <p>
          Two wizards enter the arena. Draw <b>1</b> card and play <b>1</b> card
          each turn - reduce your opponent&apos;s HP to <b>0</b> to win the duel.
        </p>
      </div>

      <div className='w-80 mx-auto'>
        <p className='fst-italic text-muted'>
          Every 11 turns all buffs and debuffs are washed away.
        </p>
      </div>
    </Modal>
  );
};