import { useEffect, useState } from 'react';
import { RoomRegistry } from '../../services/roomCode';
import { Modal } from '../modals/Modal';

interface NameEntryModalProps {
  readonly isOpen: boolean;
  readonly mode: 'create' | 'join';
  readonly isBusy: boolean;
  readonly errorMessage?: string;
  readonly onClose: () => void;
  readonly onCreate: (playerName: string) => void;
  readonly onJoin: (playerName: string, code: string) => void;
  readonly playAudio: (audio: string) => void;
}

/**
 * Modal used for both CREATE ROOM (name only) and JOIN ROOM (name + room code).
 * Styling follows the reference game's modal chrome.
 */
export const NameEntryModal = ({
  isOpen,
  mode,
  isBusy,
  errorMessage,
  onClose,
  onCreate,
  onJoin,
  playAudio,
}: NameEntryModalProps) => {
  const [playerName, setPlayerName] = useState(() => {
    return sessionStorage.getItem('playerName') ?? '';
  });
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setRoomCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (playerName.trim().length > 0) {
      sessionStorage.setItem('playerName', playerName);
    }
  }, [playerName]);

  const isJoin = mode === 'join';
  const codeValid = RoomRegistry.isValidCode(RoomRegistry.normaliseCode(roomCode));
  const canSubmit =
    playerName.trim().length > 0 && (!isJoin || codeValid) && !isBusy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    playAudioSafe('click');
    if (isJoin) {
      onJoin(playerName.trim(), RoomRegistry.normaliseCode(roomCode));
    } else {
      onCreate(playerName.trim());
    }
  };

  const playAudioSafe = (kind: string) => {
    // Avoid importing asset paths here; the caller passes click in onClose.
    void kind;
  };

  const handleCodeChange = (value: string) => {
    setRoomCode(RoomRegistry.normaliseCode(value).slice(0, 6));
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isJoin ? 'Join Room' : 'Create Room'}
      onClose={onClose}
      modalSizeClass='modal-sm'
      footer={
        <>
          <button type='button' className='btn btn-secondary me-2' onClick={onClose}>
            Back
          </button>
          <button
            type='button'
            className='btn btn-dark'
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid={isJoin ? 'join-game-button' : 'create-confirm-button'}
          >
            {isBusy ? 'Please wait...' : isJoin ? 'Join Game' : 'Create Room'}
          </button>
        </>
      }
    >
      <div className='d-flex flex-column align-items-center'>
        <label className='w-100 mb-1 fw-semibold' htmlFor='playerNameInput'>
          Wizard name
        </label>
        <input
          id='playerNameInput'
          className='form-control mb-3'
          placeholder='Enter your name'
          maxLength={16}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
          data-testid='player-name-input'
        />

        {isJoin && (
          <>
            <label className='w-100 mb-1 fw-semibold' htmlFor='roomCodeInput'>
              Room code
            </label>
            <input
              id='roomCodeInput'
              className='form-control room-code-input text-center'
              placeholder='A7K9P2'
              maxLength={6}
              value={roomCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              autoFocus
              data-testid='room-code-input'
            />
            {roomCode.length > 0 && !codeValid && (
              <p className='text-danger small mt-1 mb-0'>
                Enter a valid 6-character code.
              </p>
            )}
          </>
        )}

        {errorMessage && (
          <p className='text-danger small mt-2 mb-0' data-testid='join-error'>
            {errorMessage}
          </p>
        )}
      </div>
    </Modal>
  );
};