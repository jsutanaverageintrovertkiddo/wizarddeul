import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { WizardDuel } from '../../core/game/game';
import { clearSession, getRoomStatus, loadSession } from '../../services/roomApi';
import { resolveServerUrl } from '../../services/multiplayerClient';
import { WizardDuelBoard } from './WizardDuelBoard';

/**
 * Hosts the boardgame.io multiplayer client for one match.
 *
 * Both players connect to the same Node server over socket.io and receive
 * authoritative state updates, so health, cards, turns and the winner stay in
 * sync. We additionally poll room presence so we can show
 * "Opponent disconnected." if the other client drops.
 */
export const BattleScreen = () => {
  const { matchID } = useParams<{ matchID: string }>();
  const navigate = useNavigate();
  const session = useMemo(() => loadSession(), []);

  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  // A refresh keeps the session in sessionStorage, so the same seat reconnects.
  useEffect(() => {
    if (!session || !matchID || session.matchID !== matchID) {
      navigate('/', { replace: true });
    }
  }, [session, matchID, navigate]);

  /**
   * Presence: the room registry knows how many seats are occupied vs how many
   * clients are currently connected. If both seats are taken but only one
   * client is connected, the opponent has dropped.
   */
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const check = async () => {
      try {
        const status = await getRoomStatus(session.roomCode);
        if (cancelled) return;
        const bothSeated = Boolean(status.players['0'] && status.players['1']);
        const disconnected = bothSeated && status.connectedCount < 2;
        setOpponentDisconnected(disconnected);
      } catch {
        if (!cancelled) setOpponentDisconnected(true);
      }
    };

    void check();
    const interval = setInterval(check, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [session]);

  if (!session || !matchID) return null;

  const transport = SocketIO({ server: resolveServerUrl() });

  const DuelBoardWrapper = (props: any) => (
    <WizardDuelBoard
      {...props}
      session={session}
      opponentDisconnected={opponentDisconnected}
      onExitToMenu={() => {
        clearSession();
        window.location.href = '/';
      }}
    />
  );

  const DuelClient = Client({
    game: WizardDuel,
    board: DuelBoardWrapper,
    multiplayer: transport,
    debug: false,
  });

  return (
    <DuelClient
      matchID={matchID}
      playerID={session.playerID}
      credentials={session.token}
    />
  );
};