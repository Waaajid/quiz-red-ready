import { ref, set, onValue, off, get, update } from 'firebase/database';
import { db } from '../config/firebase';

export interface GameSession {
  id: string;
  hostId: string;
  status: 'waiting' | 'in-progress' | 'completed';
  currentRound: number;
  currentQuestionIndex: number;
  teams: {
    [teamId: string]: {
      name: string;
      color: string;
      playerCount: number;
      maxPlayers: number;
      answers: {
        [questionId: string]: string[];
      };
    }
  };
  players: {
    [playerId: string]: {
      nickname: string;
      teamId: string;
      isHost: boolean;
      connected: boolean;
      answers: {
        [questionId: string]: {
          answer: string;
          timeRemaining: number;
        };
      };
    }
  };
  roundWinners: {
    [round: number]: string[];
  };
  currentState: {
    phase: 'team-selection' | 'answering' | 'showing-results' | 'round-end' | 'completed';
    timeLeft?: number;
  };
  lastUpdated?: number;
}

export const createGameSession = async (sessionId: string, hostId: string, nickname: string): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const initialSession: GameSession = {
    id: sessionId,
    hostId,
    status: 'waiting',
    currentRound: 1,
    currentQuestionIndex: 0,
    teams: {
      crimson: { name: 'Team Crimson', color: 'bg-red-600', playerCount: 0, maxPlayers: 7, answers: {} },
      scarlet: { name: 'Team Scarlet', color: 'bg-red-500', playerCount: 0, maxPlayers: 7, answers: {} },
      ruby: { name: 'Team Ruby', color: 'bg-red-700', playerCount: 0, maxPlayers: 7, answers: {} },
      garnet: { name: 'Team Garnet', color: 'bg-red-800', playerCount: 0, maxPlayers: 7, answers: {} }
    },
    players: {
      [hostId]: {
        nickname,
        isHost: true,
        connected: true,
        teamId: '',
        answers: {}
      }
    },
    roundWinners: {},
    currentState: {
      phase: 'team-selection'
    }
  };
  await set(sessionRef, initialSession);
};

export const joinGameSession = async (
  sessionId: string, 
  playerId: string,
  nickname: string,
  teamId: string
): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const sessionSnapshot = await get(sessionRef);
  const session = sessionSnapshot.val() as GameSession;

  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'waiting') {
    throw new Error('Cannot join a game in progress');
  }

  // Add player to session
  const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
  await set(playerRef, {
    nickname,
    isHost: false,
    connected: true,
    teamId,
    answers: {}
  });
};

export const subscribeToGameSession = (
  sessionId: string,
  callback: (session: GameSession | null) => void
) => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const session = snapshot.val();
    if (!session) return callback(null);

    // Update local game state based on session changes
    callback({
      ...session,
      currentState: session.currentState || {
        phase: 'team-selection'
      }
    });
  });

  return unsubscribe;
};

export const submitAnswer = async (
  sessionId: string,
  playerId: string,
  questionId: string,
  answer: string,
  timeRemaining: number
): Promise<void> => {
  const answerRef = ref(db, `sessions/${sessionId}/players/${playerId}/answers/${questionId}`);
  const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
  
  let teamId = '';
  await onValue(playerRef, (snapshot) => {
    const player = snapshot.val();
    teamId = player.teamId;
  }, { onlyOnce: true });
  
  await set(answerRef, {
    answer,
    timeRemaining
  });

  const teamAnswersRef = ref(db, `sessions/${sessionId}/teams/${teamId}/answers/${questionId}`);
  await onValue(teamAnswersRef, (snapshot) => {
    const answers = snapshot.val() || [];
    if (!answers.includes(answer)) {
      answers.push(answer);
      set(teamAnswersRef, answers);
    }
  }, { onlyOnce: true });
};

export const updateGameState = async (
  sessionId: string,
  updates: Partial<GameSession['currentState'] & { currentRound?: number; currentQuestionIndex?: number }>
): Promise<void> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  const sessionSnapshot = await get(sessionRef);
  const session = sessionSnapshot.val() as GameSession;
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Create updates object with correct typing
  const updatedFields: Partial<GameSession> = {
    lastUpdated: Date.now(),
    currentState: {
      ...session.currentState,
      ...updates
    }
  };

  // Handle root level updates
  if ('currentRound' in updates) {
    updatedFields.currentRound = updates.currentRound;
  }
  if ('currentQuestionIndex' in updates) {
    updatedFields.currentQuestionIndex = updates.currentQuestionIndex;
  }

  // Update status based on phase transitions
  if (updates.phase === 'answering' && session.status !== 'in-progress') {
    updatedFields.status = 'in-progress';
  }
  if (updates.phase === 'completed') {
    updatedFields.status = 'completed';
  }

  // If moving to next question, ensure all updates are atomic
  if (updates.phase === 'answering' && 'currentQuestionIndex' in updates) {
    updatedFields.currentState = {
      ...updatedFields.currentState,
      timeLeft: 10 // Reset timer for new question
    };
  }

  // Perform the atomic update
  await update(sessionRef, updatedFields);
};

export const calculateRoundWinners = async (
  sessionId: string,
  round: number
): Promise<string[]> => {
  const sessionRef = ref(db, `sessions/${sessionId}`);
  let winningTeams: string[] = [];
  
  await onValue(sessionRef, (snapshot) => {
    const session = snapshot.val() as GameSession;
    if (!session) return;
    
    const teamScores = new Map<string, number>();
    
    // Count matching answers for each team
    Object.entries(session.teams).forEach(([teamId, team]) => {
      Object.entries(team.answers || {}).forEach(([questionId, answers]) => {
        if (questionId.startsWith(`r${round}`)) {
          // If multiple players in the team gave the same answer
          if (answers.length >= 2) {
            teamScores.set(teamId, (teamScores.get(teamId) || 0) + 1);
          }
        }
      });
    });
    
    if (teamScores.size > 0) {
      const maxScore = Math.max(...teamScores.values());
      winningTeams = Array.from(teamScores.entries())
        .filter(([_, score]) => score === maxScore)
        .map(([teamId]) => teamId);
      
      // Update round winners in the session
      const winnersRef = ref(db, `sessions/${sessionId}/roundWinners/${round}`);
      set(winnersRef, winningTeams);
    }
  }, { onlyOnce: true });
  
  return winningTeams;
};

export const leaveSession = async (
  sessionId: string,
  playerId: string
): Promise<void> => {
  const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
  await set(playerRef, null);
  
  // Clean up team membership
  const sessionRef = ref(db, `sessions/${sessionId}`);
  await onValue(sessionRef, (snapshot) => {
    const session = snapshot.val() as GameSession;
    if (!session) return;
    
    const player = session.players[playerId];
    if (player?.teamId) {
      const team = session.teams[player.teamId];
      if (team) {
        const teamRef = ref(db, `sessions/${sessionId}/teams/${player.teamId}`);
        set(teamRef, {
          ...team,
          playerCount: Math.max(0, team.playerCount - 1)
        });
      }
    }
  }, { onlyOnce: true });
};
