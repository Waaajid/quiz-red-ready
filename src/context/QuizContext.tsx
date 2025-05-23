
import { createContext, useContext, useState, ReactNode } from 'react';

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

interface QuizContextProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team) => void;
  teams: Team[];
  joinTeam: (teamId: string) => void;
  currentRound: number;
  setCurrentRound: (round: number) => void;
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (question: number) => void;
  questions: Question[];
  userAnswers: Answer[];
  submitAnswer: (questionId: string, answer: string, timeRemaining: number) => void;
  quizCompleted: boolean;
  setQuizCompleted: (completed: boolean) => void;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [nickname, setNickname] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Answer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  
  const [teams, setTeams] = useState<Team[]>([
    { id: 'crimson', name: 'Team Crimson', color: 'bg-red-600', playerCount: 3, maxPlayers: 7 },
    { id: 'scarlet', name: 'Team Scarlet', color: 'bg-red-500', playerCount: 5, maxPlayers: 7 },
    { id: 'ruby', name: 'Team Ruby', color: 'bg-red-700', playerCount: 2, maxPlayers: 7 },
    { id: 'garnet', name: 'Team Garnet', color: 'bg-red-800', playerCount: 6, maxPlayers: 7 }
  ]);

  const questions: Question[] = [
    // Round 1
    { id: 'r1q1', text: 'Company results party date?', roundId: 1 },
    { id: 'r1q2', text: 'https://???.conducttr.com/projects', roundId: 1 },
    { id: 'r1q3', text: 'Name of our AI-built colleague on LinkedIn', roundId: 1 },
    { id: 'r1q4', text: 'How many clocks are there in our office?', roundId: 1 },
    
    // Round 2
    { id: 'r2q1', text: 'A franchise movie running in cinemas now', roundId: 2 },
    { id: 'r2q2', text: 'Nearest store to office', roundId: 2 },
    { id: 'r2q3', text: 'Our internal communication tool', roundId: 2 },
    { id: 'r2q4', text: 'Last bank holiday date?', roundId: 2 },
    
    // Round 3
    { id: 'r3q1', text: 'A place non-Londoners mispronounce', roundId: 3 },
    { id: 'r3q2', text: '2 hydrogen and one oxygen makes?', roundId: 3 },
    { id: 'r3q3', text: '1 + 0 × 5 =', roundId: 3 },
    { id: 'r3q4', text: 'Conducttr conference date?', roundId: 3 },
  ];

  const joinTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team && team.playerCount < team.maxPlayers) {
      setTeams(teams.map(t => 
        t.id === teamId 
          ? { ...t, playerCount: t.playerCount + 1 }
          : t
      ));
      setSelectedTeam({ ...team, playerCount: team.playerCount + 1 });
    }
  };

  const submitAnswer = (questionId: string, answer: string, timeRemaining: number) => {
    setUserAnswers(prev => [...prev, { questionId, answer, timeRemaining }]);
  };

  const resetQuiz = () => {
    setCurrentRound(1);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
  };

  return (
    <QuizContext.Provider value={{ 
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
      resetQuiz
    }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
