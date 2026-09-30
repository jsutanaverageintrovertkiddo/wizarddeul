import { BoardProps } from 'boardgame.io/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useCardAnimation } from '../../hooks/useCardAnimation';
import { useLog } from '../../hooks/useLog';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { usePersistentState } from '../../hooks/usePersistentState';
import { usePreloadAssets } from '../../hooks/usePreloadAssets';

import { Card } from '../../model/cards';
import { WizardDuelState } from '../../model/shared';
import { RoomSession } from '../../model/room';
import { finishRoom } from '../../services/roomApi';
import {
  ANIMATION,
  ARENA_LOCATION,
  ARENA_MUSIC,
  AUDIO,
  click,
  IMAGES,
  MUSIC,
  victory,
  defeat,
} from '../../utils/assetUtils';
import { sleep } from '../../utils/commonUtils';
import { resolveCardAudio } from '../../utils/presentationUtils';

import { CardPreview } from '../card/CardPreview';
import { PlayerHand } from '../card/PlayerHand';
import { GameoverModal, DuelOutcome } from '../modals/GameoverModal';
import { HelpModal } from '../modals/HelpModal';
import { LogModal } from '../modals/LogModal';
import { MatchupModal } from '../modals/MatchupModal';
import { SettingsModal } from '../modals/SettingsModal';
import { EffectStack } from '../ui/EffectStack';
import { EndTurnButton, VisibleTurnPhase } from '../ui/EndTurnButton';
import { GameStatsPanel } from '../ui/GameStatsPanel';
import { IconList } from '../ui/IconList';
import { PlayerStatsPanel } from '../ui/PlayerStatsPanel';

export const PAUSE_INTERVAL = 900;

interface DuelBoardProps extends BoardProps<WizardDuelState> {
  readonly session: RoomSession;
  readonly onExitToMenu: () => void;
  readonly opponentDisconnected: boolean;
}

/**
 * The online battle screen. Layout, panels, cards and animations mirror the
 * reference project; the local player is always rendered at the bottom.
 */
export const WizardDuelBoard = ({
  ctx,
  G,
  moves,
  events,
  playerID,
  session,
  onExitToMenu,
  opponentDisconnected,
}: DuelBoardProps) => {
  usePreloadAssets(IMAGES, ANIMATION, AUDIO, MUSIC);

  const navigate = useNavigate();

  // --- Seat mapping: the local player is shown at the bottom of the arena ---
  const localID = (playerID ?? '0') as '0' | '1';
  const opponentID = localID === '0' ? '1' : '0';
  const localPlayer = G.players[localID];
  const opponentPlayer = G.players[opponentID];

  const isLocalTurn = ctx.currentPlayer === localID;
  const isGameOver = Boolean(ctx.gameover);

  // --- Local UI state ---
  const [selectedCardToPlay, setSelectedCardToPlay] = useState<Card | undefined>();
  const [playerSelectedIndexToPlay, setPlayerSelectedIndexToPlay] = useState<
    number | undefined
  >();
  const [turnPhase, setTurnPhase] = useState<VisibleTurnPhase>(
    VisibleTurnPhase.opponentTurn
  );
  const [outcome, setOutcome] = useState<DuelOutcome>('draw');
  const [showGameoverModal, setShowGameoverModal] = useState(false);
  const [showMatchupModal, setShowMatchupModal] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [message, setMessage] = useState<string | undefined>();

  const [showGameStats, setShowGameStats] = usePersistentState(
    'showGameStats',
    true
  );
  const [showEffectStack, setShowEffectStack] = usePersistentState(
    'showEffectStack',
    true
  );

  const [visibleCurrentTurn, setVisibleCurrentTurn] = useState(0);

  const { logEntries, addLogEntry } = useLog();
  const { playAudio, toggleAudioMute, isAudioMuted } = useAudioPlayer();
  const { playMusic, pauseMusic, toggleMusic, isMusicMuted } =
    useMusicPlayer(ARENA_MUSIC);
  const {
    cardAnimationData,
    showPlayerAnimation,
    showEnemyAnimation,
    handleShowCardAnimation,
  } = useCardAnimation(G, ctx, localID);

  const playCardAudio = (card: Card) => {
    playAudio(resolveCardAudio(card, G, ctx));
  };

  // Track which cards we have already logged so a refresh/undo does not
  // duplicate entries. Keyed by turn + index to stay stable across syncs.
  const loggedMovesRef = useRef<Set<string>>(new Set());

  // --- On each new turn: draw a card automatically and reset selection ---
  useEffect(() => {
    if (isGameOver) return;

    const runDraw = async () => {
      await sleep(PAUSE_INTERVAL);
      setSelectedCardToPlay(undefined);
      setPlayerSelectedIndexToPlay(undefined);
      setVisibleCurrentTurn((prev) => Math.max(prev, ctx.turn));

      if (!isLocalTurn) {
        setTurnPhase(VisibleTurnPhase.opponentTurn);
        return;
      }

      if (ctx.turn > 1 && localPlayer.hand.length < 5) {
        try {
          moves.drawCard();
        } catch {
          /* Hand already full or deck empty; ignore. */
        }
      }

      setTurnPhase(
        localPlayer.hand.length > 0
          ? VisibleTurnPhase.endTurnDisabled
          : VisibleTurnPhase.opponentTurn
      );
    };

    void runDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.turn, ctx.currentPlayer, isGameOver]);

  // --- Game over handling: play victory/defeat and show the result modal ---
  useEffect(() => {
    if (!ctx.gameover) return;

    const winner = ctx.gameover.winner as string | undefined;
    const nextOutcome: DuelOutcome = !winner
      ? 'draw'
      : winner === localID
      ? 'victory'
      : 'defeat';

    setOutcome(nextOutcome);

    const show = async () => {
      await sleep(PAUSE_INTERVAL);
      setShowGameoverModal(true);
      pauseMusic();

      if (nextOutcome === 'victory') {
        playAudio(victory);
        // Let the server know the room is finished so late joiners are refused.
        void finishRoom(session.roomCode).catch(() => undefined);
      } else if (nextOutcome === 'defeat') {
        playAudio(defeat);
      }
    };

    void show();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.gameover]);

  // --- Card interaction ---
  const handleCardClick = (index: number) => {
    if (isGameOver || !isLocalTurn) {
      if (!isLocalTurn && !isGameOver) {
        setMessage('Wait for your turn.');
        setTimeout(() => setMessage(undefined), 1800);
      }
      return;
    }

    setSelectedCardToPlay(localPlayer.hand[index]);
    setPlayerSelectedIndexToPlay(index);
    playAudio(click);
    setTurnPhase(VisibleTurnPhase.endTurnEnabled);
  };

  const handleEndTurnButtonClick = () => {
    if (isGameOver) return;

    if (!isLocalTurn) {
      setMessage('Wait for your turn.');
      setTimeout(() => setMessage(undefined), 1800);
      return;
    }

    if (turnPhase !== VisibleTurnPhase.endTurnEnabled) return;
    if (playerSelectedIndexToPlay === undefined || !selectedCardToPlay) return;

    const card = localPlayer.hand[playerSelectedIndexToPlay];
    const moveKey = `${ctx.turn}-${localID}-${playerSelectedIndexToPlay}`;

    if (!loggedMovesRef.current.has(moveKey)) {
      loggedMovesRef.current.add(moveKey);
      addLogEntry({
        turn: ctx.turn,
        playerName: localPlayer.name,
        cardName: card.name,
        cardText: card.text,
      });
    }

    playCardAudio(card);
    void handleShowCardAnimation(card);

    try {
      moves.playCard(playerSelectedIndexToPlay);
      // Each wizard plays exactly one card per turn, so end the turn right
      // after the play. boardgame.io synchronises this to both clients.
      events?.endTurn?.();
    } catch {
      setMessage('That move is not allowed.');
      setTimeout(() => setMessage(undefined), 1800);
    }

    setSelectedCardToPlay(undefined);
    setPlayerSelectedIndexToPlay(undefined);
    setTurnPhase(VisibleTurnPhase.opponentTurn);
  };

  // --- Log opponent plays by watching the shared turn/card state ---
  const lastSyncedTurnRef = useRef(0);
  useEffect(() => {
    if (isGameOver) return;
    if (ctx.currentPlayer === localID) return;

    // When the opponent's turn begins, their hand briefly has 5 cards, then 4
    // after they play. We record the play once their turn ends.
    const key = `${ctx.turn}-opponent`;
    if (lastSyncedTurnRef.current === ctx.turn) return;

    lastSyncedTurnRef.current = ctx.turn;
    if (loggedMovesRef.current.has(key)) return;
    loggedMovesRef.current.add(key);
  }, [ctx.currentPlayer, ctx.turn, isGameOver, localID]);

  const currentPlayerLabel = useMemo(() => {
    const name = G.players[ctx.currentPlayer]?.name ?? 'Wizard';
    return ctx.currentPlayer === localID ? `${name} (You)` : name;
  }, [ctx.currentPlayer, G.players, localID]);

  const handleExitToMenu = () => {
    pauseMusic();
    onExitToMenu();
  };

  const handlePlayAgain = () => {
    // Return to the menu to create a fresh room for a rematch.
    pauseMusic();
    navigate('/', { replace: true });
  };

  return (
    <div
      className='container-fluid vh-100 d-flex flex-column p-2 bg-board'
      style={
        {
          '--bg-image': `url(${ARENA_LOCATION})`,
        } as React.CSSProperties
      }
    >
      {/* Opponent row */}
      <div className='row'>
        <div className='col-3'>
          <PlayerStatsPanel
            player={opponentPlayer}
            label={`${opponentPlayer.name} (Opponent)`}
            showCardAnimation={showEnemyAnimation}
            cardAnimationData={cardAnimationData}
            isActiveTurn={!isLocalTurn && !isGameOver}
          />
        </div>

        <div className='col-6'>
          <PlayerHand
            player={{ ...opponentPlayer, id: '1' }}
            showEnemyHand={false}
          />
        </div>

        <div className='col-3'>
          <IconList
            setShowLogModal={setShowLogModal}
            setShowSettingsModal={setShowSettingsModal}
            setShowHelpModal={setShowHelpModal}
            playAudio={playAudio}
          />
        </div>
      </div>

      {/* Middle: effects, preview, turn/arena info */}
      <div className='row flex-grow-1'>
        <div className='col-3'>
          <EffectStack
            opponentEffects={opponentPlayer.effects}
            playerEffects={localPlayer.effects}
            showEffectStack={showEffectStack}
          />
        </div>

        <div className='col-6'>
          <CardPreview selectedCard={selectedCardToPlay} />

          {message && (
            <div className='board-message' data-testid='board-message'>
              {message}
            </div>
          )}
        </div>

        <div className='col-3 d-flex flex-column align-items-end justify-content-center'>
          <GameStatsPanel
            G={G}
            visibleTurn={visibleCurrentTurn}
            showGameStats={showGameStats}
            currentPlayerLabel={currentPlayerLabel}
          />
        </div>
      </div>

      {/* Local player row */}
      <div className='row align-items-end'>
        <div className='col-3'>
          <PlayerStatsPanel
            player={localPlayer}
            label={`${localPlayer.name} (You)`}
            showCardAnimation={showPlayerAnimation}
            cardAnimationData={cardAnimationData}
            isActiveTurn={isLocalTurn && !isGameOver}
          />
        </div>

        <div className='col-6'>
          <PlayerHand
            player={{ ...localPlayer, id: '0' }}
            showEnemyHand={true}
            handleCardClick={handleCardClick}
            selectedIndex={playerSelectedIndexToPlay}
            interactive={true}
          />
        </div>

        <div className='col-3'>
          <EndTurnButton
            turnPhase={
              isGameOver
                ? VisibleTurnPhase.opponentTurn
                : isLocalTurn
                ? turnPhase
                : VisibleTurnPhase.opponentTurn
            }
            handleEndTurnButtonClick={handleEndTurnButtonClick}
          />
        </div>
      </div>

      {opponentDisconnected && !isGameOver && (
        <div className='disconnect-banner' data-testid='disconnect-banner'>
          Opponent disconnected.
        </div>
      )}

      <MatchupModal
        showMatchupModal={showMatchupModal}
        setShowMatchupModal={setShowMatchupModal}
        playMusic={playMusic}
        localName={session.playerName}
        opponentName={session.opponentName}
      />

      <GameoverModal
        showGameoverModal={showGameoverModal}
        outcome={outcome}
        onPlayAgain={handlePlayAgain}
        onReturnToMenu={handleExitToMenu}
      />

      <LogModal
        showLogModal={showLogModal}
        setShowLogModal={setShowLogModal}
        logEntries={logEntries}
        playAudio={playAudio}
      />

      <SettingsModal
        showSettingsModal={showSettingsModal}
        setShowSettingsModal={setShowSettingsModal}
        playAudio={playAudio}
        toggleAudioMute={toggleAudioMute}
        isAudioMuted={isAudioMuted}
        toggleMusic={toggleMusic}
        isMusicMuted={isMusicMuted}
        showGameStats={showGameStats}
        setShowGameStats={setShowGameStats}
        showEffectStack={showEffectStack}
        setShowEffectStack={setShowEffectStack}
        onExitToMenu={handleExitToMenu}
      />

      <HelpModal
        showHelpModal={showHelpModal}
        setShowHelpModal={setShowHelpModal}
        playAudio={playAudio}
      />
    </div>
  );
};