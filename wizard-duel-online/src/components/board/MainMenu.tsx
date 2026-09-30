import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { usePreloadAssets } from '../../hooks/usePreloadAssets';
import { CardId } from '../../model/cards';
import { RoomError } from '../../model/room';
import { createRoom, joinRoom, saveSession } from '../../services/roomApi';
import {
  ANIMATION,
  AUDIO,
  cardFronts,
  click,
  IMAGES,
  MUSIC,
} from '../../utils/assetUtils';
import { CardGalleryModal } from '../modals/CardGalleryModal';
import { HelpModal } from '../modals/HelpModal';
import { NameEntryModal } from '../lobby/NameEntryModal';

type MenuMode = 'idle' | 'create' | 'join';

export const MainMenu = () => {
  // Preload to use cache and reduce latency between screens.
  usePreloadAssets(IMAGES, ANIMATION, AUDIO, MUSIC);

  const navigate = useNavigate();
  const { playAudio } = useAudioPlayer();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCardGallery, setShowCardGallery] = useState(false);
  const [mode, setMode] = useState<MenuMode>('idle');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleHelpClick = () => {
    setShowHelpModal(true);
    playAudio(click);
  };

  const handleCardsClick = () => {
    setShowCardGallery(true);
    playAudio(click);
  };

  const openCreate = () => {
    setMode('create');
    setErrorMessage(undefined);
    playAudio(click);
  };

  const openJoin = () => {
    setMode('join');
    setErrorMessage(undefined);
    playAudio(click);
  };

  const handleCreate = async (playerName: string) => {
    setIsBusy(true);
    setErrorMessage(undefined);
    try {
      const res = await createRoom(playerName);
      saveSession({
        roomCode: res.roomCode,
        matchID: res.matchID,
        playerID: res.playerID,
        token: res.token,
        playerName: res.playerName,
        opponentName: 'Waiting...',
        createdAt: Date.now(),
      });
      navigate(`/room/${res.roomCode}`);
    } catch (e) {
      const message =
        e instanceof RoomError ? e.message : 'Could not reach the server.';
      setErrorMessage(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoin = async (playerName: string, code: string) => {
    setIsBusy(true);
    setErrorMessage(undefined);
    try {
      const res = await joinRoom(code, playerName);
      saveSession({
        roomCode: res.roomCode,
        matchID: res.matchID,
        playerID: res.playerID,
        token: res.token,
        playerName: res.playerName,
        opponentName: res.opponentName,
        createdAt: Date.now(),
      });
      navigate(`/battle/${res.matchID}`);
    } catch (e) {
      const message =
        e instanceof RoomError ? e.message : 'Could not reach the server.';
      setErrorMessage(message);
    } finally {
      setIsBusy(false);
    }
  };

  const closeModal = () => {
    setMode('idle');
    playAudio(click);
  };

  return (
    <div
      className='d-flex flex-column bg-menu vh-100 justify-content-center align-items-center'
      style={{ position: 'relative' }}
    >
      <div className='d-flex align-items-baseline mb-5'>
        <p className='font-cinzel-semibold menu-title-fs m-0'>Wizard Duel</p>
        <span className='badge bg-dark ms-2'>Online</span>
      </div>

      <p className='menu-tagline mb-4'>Two wizards. One arena. Zero mercy.</p>

      <div className='d-flex flex-column mt-3'>
        <button
          className='btn btn-dark btn-lg btn-width mb-3'
          onClick={openCreate}
          disabled={isBusy}
          data-testid='create-room-button'
        >
          Create Room
        </button>

        <button
          className='btn btn-dark btn-lg btn-width mb-3'
          onClick={openJoin}
          disabled={isBusy}
          data-testid='join-room-button'
        >
          Join Room
        </button>

        <button
          className='btn btn-dark btn-lg btn-width mb-3'
          onClick={handleHelpClick}
        >
          Instructions
        </button>

        <button
          className='btn btn-dark btn-lg btn-width'
          onClick={handleCardsClick}
        >
          Cards
        </button>
      </div>

      {errorMessage && (
        <p className='menu-error mt-4' data-testid='menu-error'>
          {errorMessage}
        </p>
      )}

      <NameEntryModal
        isOpen={mode === 'create' || mode === 'join'}
        mode={mode === 'join' ? 'join' : 'create'}
        isBusy={isBusy}
        errorMessage={errorMessage}
        onClose={closeModal}
        onCreate={handleCreate}
        onJoin={handleJoin}
        playAudio={playAudio}
      />

      <HelpModal
        showHelpModal={showHelpModal}
        setShowHelpModal={setShowHelpModal}
        playAudio={playAudio}
      />
      <CardGalleryModal
        showCardGallery={showCardGallery}
        setShowCardGallery={setShowCardGallery}
        cardImages={cardFronts.filter(
          (_, cardId) => cardId.toString() !== CardId.Wish1
        )}
        playAudio={playAudio}
      />
    </div>
  );
};