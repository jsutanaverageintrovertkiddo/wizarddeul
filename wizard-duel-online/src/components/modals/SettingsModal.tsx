import { useState } from 'react';
import { click } from '../../utils/assetUtils';
import { ConfirmModal } from './ConfirmModal';
import { Modal } from './Modal';

interface SettingsModalProps {
  readonly showSettingsModal: boolean;
  readonly setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
  readonly playAudio: (audio: string) => void;
  readonly toggleAudioMute: () => void;
  readonly isAudioMuted: boolean;
  readonly toggleMusic: () => void;
  readonly isMusicMuted: boolean;
  readonly showGameStats: boolean;
  readonly setShowGameStats: React.Dispatch<React.SetStateAction<boolean>>;
  readonly showEffectStack: boolean;
  readonly setShowEffectStack: React.Dispatch<React.SetStateAction<boolean>>;
  readonly onExitToMenu: () => void;
}

export const SettingsModal = ({
  showSettingsModal,
  setShowSettingsModal,
  playAudio,
  toggleAudioMute,
  isAudioMuted,
  toggleMusic,
  isMusicMuted,
  showGameStats,
  setShowGameStats,
  showEffectStack,
  setShowEffectStack,
  onExitToMenu,
}: SettingsModalProps) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | undefined>();

  const handleSettingsClose = () => {
    setShowSettingsModal(false);
    playAudio(click);
  };

  const toggleGameStatsDisplay = () =>
    setShowGameStats((prevState) => !prevState);

  const toggleEffectStackDisplay = () =>
    setShowEffectStack((prevState) => !prevState);

  const handleExitToMenu = () => {
    setConfirmAction('exitToMenu');
    setShowConfirmModal(true);
    setShowSettingsModal(false);
  };

  const handleConfirm = () => {
    if (confirmAction === 'exitToMenu') {
      onExitToMenu();
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(undefined);
    setShowSettingsModal(true);
  };

  return (
    <>
      <Modal
        isOpen={showSettingsModal}
        onClose={handleSettingsClose}
        modalSizeClass='modal-sm'
        customHeader={
          <h4 className='modal-title w-100 text-center font-bold ms-3'>
            Settings
          </h4>
        }
      >
        <div className='d-flex flex-column align-items-center'>
          <div className='btn-group-vertical btn-width mb-3'>
            <button
              type='button'
              className='btn btn-dark mb-1'
              onClick={toggleMusic}
            >
              {isMusicMuted ? 'Unmute Game Music' : 'Mute Game Music'}
            </button>
            <button
              type='button'
              className='btn btn-dark'
              onClick={toggleAudioMute}
            >
              {isAudioMuted ? 'Unmute Game Sounds' : 'Mute Game Sounds'}
            </button>
          </div>

          <div className='btn-group-vertical btn-width mb-3'>
            <button
              type='button'
              className='btn btn-dark mb-1'
              onClick={toggleEffectStackDisplay}
            >
              {showEffectStack
                ? 'Hide Buffs & Debuffs'
                : 'Show Buffs & Debuffs'}
            </button>
            <button
              type='button'
              className='btn btn-dark'
              onClick={toggleGameStatsDisplay}
            >
              {showGameStats
                ? 'Hide Turn & Deck Info'
                : 'Show Turn & Deck Info'}
            </button>
          </div>

          <div className='btn-group-vertical btn-width mb-2'>
            <button
              type='button'
              className='btn btn-dark'
              onClick={handleExitToMenu}
            >
              Exit to Title
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmModal}
        title='Exit to Title?'
        message='You will forfeit the duel and leave the room. Continue?'
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
};