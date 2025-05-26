import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { ref, set, onValue, off, get, update } from 'firebase/database';
import { db } from '../config/firebase';
import { 
  createGameSession, 
  joinGameSession, 
  subscribeToGameSession,
  submitAnswer as submitSessionAnswer,
  leaveSession,
  GameSession
} from '../services/gameSession';

interface Team {
  id: string;
  name: string;
  color: string;
  playerCount: number;
  maxPlayers: number;
}

interface Question {
  id: string;
  text: string;
  roundId: number;
}

interface Answer {
  questionId: string;
  answer: string;
  timeRemaining: number;
}

interface PlayerAnswer {
  playerId: string;
  teamName: string;
  roundNumber: number;
  questionId: string;
  answer: string;
}

interface RoundResult {
  roundNumber: number;
  winningTeam: string;
  matchedAnswers: {
    [teamName: string]: {
      answer: string;
      players: string[];
      count: number;
    }[];
  };
}

interface TeamScore {
  teamName: string;
  roundsWon: number[];
  diceRollsRemaining: number;
}

interface MultiplayerSession {
  id: string;
  status: 'waiting' | 'in-progress' | 'completed';
  teams: {
    [teamId: string]: {
      name: string;
      players: string[];
      answeredCount: number;
    }
  };
}

interface QuizContextProps {
  // User and team management
  nickname: string;
  setNickname: (nickname: string) => void;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team) => void;
  teams: Team[];
  joinTeam: (teamId: string) => Promise<void>;

  // Game state
  currentRound: number;
  setCurrentRound: (round: number) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (question: number) => void;
  questions: Question[];
  userAnswers: Answer[];
  quizCompleted: boolean;
  setQuizCompleted: (completed: boolean) => void;
  
  // Game actions
  submitAnswer: (questionId: string, answer: string, timeRemaining: number) => void;
  submitPlayerAnswer: (answer: Omit<PlayerAnswer, 'playerId'>) => void;
  processRoundResults: (roundNumber: number) => void;
  resetQuiz: () => Promise<void>;

  // Game data
  playerAnswers: PlayerAnswer[];
  roundResults: RoundResult[];
  teamScores: TeamScore[];
  getRoundWinner: (roundNumber: number) => string | null;
  getDiceRolls: (teamName: string) => number;

  // Session management
  gameSession: GameSession | null;
  sessionId: string | null;
  isSessionHost: boolean;
  isMultiplayer: boolean;
  multiplayerStatus: 'connecting' | 'connected' | 'disconnected';
  sessionError: string | null;
  
  // Session actions
  startNewSession: () => Promise<string>;
  joinExistingSession: (sessionId: string) => Promise<void>;
  leaveCurrentSession: () => Promise<void>;
  updateGameState: (updates: Partial<GameSession['currentState'] & { 
    currentRound?: number; 
    currentQuestionIndex?: number 
  }>) => Promise<void>;
}

// Create the context
const QuizContext = createContext<QuizContextProps | undefined>(undefined);

// Create the provider component
export function QuizProvider({ children }: { children: ReactNode }) {
  const [nickname, setNickname] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [teamScores, setTeamScores] = useState<TeamScore[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isMultiplayer] = useState(false);
  const [multiplayerStatus, setMultiplayerStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSessionHost, setIsSessionHost] = useState(false);
  const [teams, setTeams] = useState<Team[]>([
    { id: 'crimson', name: 'Team Crimson', color: 'bg-red-600', playerCount: 0, maxPlayers: 7 },
    { id: 'scarlet', name: 'Team Scarlet', color: 'bg-red-500', playerCount: 0, maxPlayers: 7 },
    { id: 'ruby', name: 'Team Ruby', color: 'bg-red-700', playerCount: 0, maxPlayers: 7 },
    { id: 'garnet', name: 'Team Garnet', color: 'bg-red-800', playerCount: 0, maxPlayers: 7 }
  ]);

  // Update team player counts whenever game session changes
  useEffect(() => {
    if (gameSession && gameSession.teams) {
      setTeams(prevTeams => 
        prevTeams.map(team => {
          const sessionTeam = gameSession.teams[team.id];
          return sessionTeam 
            ? { ...team, playerCount: sessionTeam.playerCount }
            : { ...team, playerCount: 0 };
        })
      );
    }
  }, [gameSession]);

  // Updated questions list as requested
  const questions: Question[] = [
    { id: 'r1q1', text: 'What is the company results party date? (dd/mm)', roundId: 1 },
    { id: 'r1q2', text: 'What is the missing domain in https://???.conducttr.com/projects?', roundId: 1 },
    { id: 'r1q3', text: 'What is the name of our AI-built colleague on LinkedIn?', roundId: 1 },
    { id: 'r1q4', text: 'How many clocks are there in our office?', roundId: 1 },
    { id: 'r2q1', text: 'What franchise movie is currently running in cinemas?', roundId: 2 },
    { id: 'r2q2', text: 'What is the nearest store to the office?', roundId: 2 },
    { id: 'r2q3', text: 'What is our internal communication tool?', roundId: 2 },
    { id: 'r2q4', text: 'When was the last bank holiday? (dd/mm)', roundId: 2 },
    { id: 'r3q1', text: 'What place do non-Londoners often mispronounce?', roundId: 3 },
    { id: 'r3q2', text: 'What does two hydrogen and one oxygen make?', roundId: 3 },
    { id: 'r3q3', text: 'What is 1 + 0 × 5?', roundId: 3 },
    { id: 'r3q4', text: 'When is the Conducttr conference? (dd/mm)', roundId: 3 },
  ];

  const joinTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team || !sessionId) {
      throw new Error('Invalid team selection');
    }

    try {
      // Get current session state
      const sessionRef = ref(db, `sessions/${sessionId}`);
      const snapshot = await get(sessionRef);
      const currentSession = snapshot.val() as GameSession;

      if (!currentSession) {
        throw new Error('Session not found');
      }
      
      // Check total players in session
      const totalPlayers = Object.keys(currentSession.players || {}).length;
      if (totalPlayers >= 28) {
        throw new Error('Game room is full (maximum 28 players)');
      }
      
      // Calculate new player count
      const newPlayerCount = (currentSession.teams[teamId]?.playerCount ?? 0) + 1;
      
      if (newPlayerCount > team.maxPlayers) {
        throw new Error('Team is full');
      }

      // Update team in Firebase
      const updates = {
        [`/sessions/${sessionId}/teams/${teamId}/playerCount`]: newPlayerCount,
        [`/sessions/${sessionId}/players/${nickname}/teamId`]: teamId
      };
      
      await update(ref(db), updates);
      
      // Update local state
      setSelectedTeam(team);
    } catch (error) {
      console.error('Failed to join team:', error);
      throw error;
    }
  };

  const resetQuiz = async () => {
    // Reset local quiz state
    setCurrentRound(1);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setPlayerAnswers([]);
    setRoundResults([]);
    setTeamScores([]);
    
    // Update game session if it exists
    if (sessionId) {
      try {
        // Reset the entire game state
        const sessionRef = ref(db, `sessions/${sessionId}`);
        const sessionSnapshot = await get(sessionRef);
        const session = sessionSnapshot.val() as GameSession;
        
        if (session) {
          // Preserve teams and players but reset game state
          const updates = {
            status: 'in-progress',
            currentRound: 1,
            currentQuestionIndex: 0,
            roundWinners: {},
            currentState: {
              phase: 'answering',
            },
            lastUpdated: Date.now()
          };
          
          await update(sessionRef, updates);
        }
      } catch (error) {
        console.error('Failed to reset game session:', error);
        setSessionError(error instanceof Error ? error.message : 'Failed to reset session');
      }
    }
  };

  const submitPlayerAnswer = useCallback((answer: Omit<PlayerAnswer, 'playerId'>) => {
    const playerId = nickname; // Using nickname as playerId for simplicity
    setPlayerAnswers(prev => [...prev, { ...answer, playerId }]);
  }, [nickname]);

  const processRoundResults = useCallback((roundNumber: number) => {
    const roundAnswers = playerAnswers.filter(a => a.roundNumber === roundNumber);
    
    // Group answers by team
    const answersByTeam: { [teamName: string]: { [answer: string]: string[] } } = {};
    roundAnswers.forEach(answer => {
      if (!answersByTeam[answer.teamName]) {
        answersByTeam[answer.teamName] = {};
      }
      if (!answersByTeam[answer.teamName][answer.answer]) {
        answersByTeam[answer.teamName][answer.answer] = [];
      }
      answersByTeam[answer.teamName][answer.answer].push(answer.playerId);
    });

    // Find matching answers for each team
    const matchedAnswers: RoundResult['matchedAnswers'] = {};
    let maxMatches = 0;
    let winningTeam = '';

    Object.entries(answersByTeam).forEach(([teamName, answers]) => {
      // Only consider answers that have at least 2 players matching
      matchedAnswers[teamName] = Object.entries(answers)
        .map(([answer, players]) => ({
          answer,
          players,
          count: players.length
        }))
        .filter(match => match.count >= 2) // Only keep answers with 2 or more matches
        .sort((a, b) => b.count - a.count);

      // Update winning team if this team has more matches and at least 2 players matched
      const teamMaxMatches = matchedAnswers[teamName][0]?.count ?? 0;
      if (teamMaxMatches > maxMatches && teamMaxMatches >= 2) {
        maxMatches = teamMaxMatches;
        winningTeam = teamName;
      }
    });

    const roundResult: RoundResult = {
      roundNumber,
      winningTeam,
      matchedAnswers
    };

    setRoundResults(prev => [...prev, roundResult]);

    // Update team scores - award 1 dice roll for each round win
    setTeamScores(prev => {
      const existing = prev.find(s => s.teamName === winningTeam);
      if (existing) {
        return prev.map(score => 
          score.teamName === winningTeam
            ? {
                ...score,
                roundsWon: [...score.roundsWon, roundNumber],
                diceRollsRemaining: 1 // Set to exactly 1 roll
              }
            : score
        );
      }
      return [...prev, {
        teamName: winningTeam,
        roundsWon: [roundNumber],
        diceRollsRemaining: 1 // Each winning team gets 1 roll
      }];
    });
  }, [playerAnswers]);

  const getRoundWinner = useCallback((roundNumber: number) => {
    const result = roundResults.find(r => r.roundNumber === roundNumber);
    return result?.winningTeam ?? null;
  }, [roundResults]);

  const getDiceRolls = useCallback((teamName: string) => {
    return teamScores.find(s => s.teamName === teamName)?.diceRollsRemaining ?? 0;
  }, [teamScores]);

  useEffect(() => {
    return () => {
      // Cleanup any active session subscription
      if (sessionId) {
        leaveSession(sessionId, nickname).catch(console.error);
      }
    };
  }, [sessionId, nickname]);

  const startNewSession = useCallback(async () => {
    try {
      const newSessionId = Math.random().toString(36).substring(2, 15);
      await createGameSession(newSessionId, nickname, nickname);
      setSessionId(newSessionId);
      setIsSessionHost(true);
      
      // Subscribe to session updates
      const unsubscribe = subscribeToGameSession(newSessionId, (session) => {
        setGameSession(session);
      });
      
      return newSessionId;
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to create session');
      throw error;
    }
  }, [nickname]);

  const joinExistingSession = useCallback(async (joinSessionId: string) => {
    try {
      await joinGameSession(joinSessionId, nickname, nickname, selectedTeam?.id || '');
      setSessionId(joinSessionId);
      setIsSessionHost(false);
      
      // Subscribe to session updates
      const unsubscribe = subscribeToGameSession(joinSessionId, (session) => {
        setGameSession(session);
      });
      
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : 'Failed to join session');
      throw error;
    }
  }, [nickname, selectedTeam]);

  const leaveCurrentSession = useCallback(async () => {
    if (sessionId) {
      await leaveSession(sessionId, nickname);
      setSessionId(null);
      setGameSession(null);
      setIsSessionHost(false);
    }
  }, [sessionId, nickname]);

  const submitAnswer = useCallback((questionId: string, answer: string, timeRemaining: number) => {
    // Update local state
    setUserAnswers(prev => [...prev, { questionId, answer, timeRemaining }]);
    
    // If in multiplayer mode, submit to session
    if (sessionId && nickname) {
      submitSessionAnswer(sessionId, nickname, questionId, answer, timeRemaining)
        .catch(error => {
          setSessionError(error instanceof Error ? error.message : 'Failed to submit answer');
        });
    }
  }, [sessionId, nickname]);

  const handleUpdateGameState = async (updates: Parameters<QuizContextProps['updateGameState']>[0]) => {
    if (!sessionId) {
      throw new Error('No active session');
    }
    
    // Simple implementation of updateGameState
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const firebaseUpdates: { [key: string]: any } = {};
    
    if (updates.phase) {
      firebaseUpdates['currentState/phase'] = updates.phase;
    }
    if (updates.currentRound !== undefined) {
      firebaseUpdates.currentRound = updates.currentRound;
    }
    if (updates.currentQuestionIndex !== undefined) {
      firebaseUpdates.currentQuestionIndex = updates.currentQuestionIndex;
    }
    if (updates.timeLeft !== undefined) {
      firebaseUpdates['currentState/timeLeft'] = updates.timeLeft;
    }
    if (updates.currentQuestion !== undefined) {
      firebaseUpdates['currentState/currentQuestion'] = updates.currentQuestion;
    }
    
    firebaseUpdates.lastUpdated = Date.now();
    
    await update(sessionRef, firebaseUpdates);
  };

  const contextValue: QuizContextProps = {
    nickname,
    setNickname,
    selectedTeam,
    setSelectedTeam,
    teams,
    joinTeam,
    currentRound,
    setCurrentRound,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    questions,
    userAnswers,
    submitAnswer,
    quizCompleted,
    setQuizCompleted,
    resetQuiz,
    playerAnswers,
    roundResults,
    teamScores,
    submitPlayerAnswer,
    processRoundResults,
    getRoundWinner,
    getDiceRolls,
    sessionId,
    isMultiplayer,
    multiplayerStatus,
    gameSession,
    sessionError,
    startNewSession,
    joinExistingSession,
    leaveCurrentSession,
    isSessionHost,
    updateGameState: handleUpdateGameState
  };

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
}

// Export the context
export { QuizContext };
