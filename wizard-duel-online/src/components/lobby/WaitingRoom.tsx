import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { click } from '../../utils/assetUtils';
import {
  clearSession,
  getRoomStatus,
  loadSession,
} from '../../services/roomApi';
import { getAvatarForPlayer } from '../../utils/assetUtils';

/**
 * WAITING screen. Shown to the host after CREATE ROOM. Polls the room until a
 * second player joins, then auto-transitions both clients into the battle.
 */
export const WaitingRoom = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { playAudio } = useAudioPlayer();

  const [status, setStatus] = useState<
    { players: Record<string, string | null>; started: boolean } | undefined
  >();
  const [error, setError] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const navigatedRef = useRef(false);

  useEffect(() => {
    const session = loadSession();
    if (!session || session.roomCode !== code) {
      // No session for this room in this tab → send home.
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await getRoomStatus(session.roomCode);
        if (cancelled) return;
        setStatus({ players: res.players, started: res.started });

        if (res.started && !navigatedRef.current) {
          navigatedRef.current = true;
          navigate(`/battle/${session.matchID}`, { replace: true });
        }
      } catch {
        if (!cancelled) setError('Lost connection to the server.');
      }
    };

    void poll();
    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [code, navigate]);

  const playerCount =
    (status?.players['0'] ? 1 : 0) + (status?.players['1'] ? 1 : 0);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      playAudio(click);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleCancel = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  return (
    <div className='bg-menu vh-100 d-flex flex-column justify-content-center align-items-center'>
      <p className='font-cinzel-semibold menu-title-fs m-0 mb-4'>Wizard Duel</p>

      <div className='waiting-panel d-flex flex-column align-items-center'>
        <p className='waiting-label mb-1'>Room Code</p>
        <p className='room-code-display' data-testid='room-code-display'>
          {code}
        </p>

        <div className='d-flex align-items-center mb-4'>
          <div className='waiting-wizard me-3'>
            <img src={getAvatarForPlayer('0')} alt='host avatar' height={70} width={70} />
            <span className='waiting-wizard-name'>{status?.players['0'] ?? 'You'}</span>
          </div>

          <span className='waiting-vs mx-3'>VS</span>

          <div className='waiting-wizard waiting-wizard-empty'>
            {status?.players['1'] ? (
              <>
                <img
                  src={getAvatarForPlayer('1')}
                  alt='guest avatar'
                  height={70}
                  width={70}
                />
                <span className='waiting-wizard-name'>{status.players['1']}</span>
              </>
            ) : (
              <>
                <div className='waiting-slot'>?</div>
                <span className='waiting-wizard-name'>Waiting...</span>
              </>
            )}
          </div>
        </div>

        <p className='waiting-status' data-testid='waiting-status'>
          {playerCount < 2 ? 'Waiting for opponent...' : 'Opponent joined!'}
        </p>

        <p className='waiting-count mb-4' data-testid='player-count'>
          {playerCount} / 2 Players
        </p>

        <button
          type='button'
          className='btn btn-dark btn-width mb-2'
          onClick={handleCopy}
          data-testid='copy-code-button'
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>

        <button
          type='button'
          className='btn btn-secondary btn-width'
          onClick={handleCancel}
        >
          Cancel
        </button>

        {error && <p className='menu-error mt-3'>{error}</p>}
      </div>
    </div>
  );
};