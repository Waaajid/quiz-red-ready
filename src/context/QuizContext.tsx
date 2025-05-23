
import { createContext, useContext, useState, ReactNode } from 'react';

interface Team {
  id: string;
  name: string;
  color: string;
  playerCount: number;
  maxPlayers: number;
}

interface QuizContextProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  selectedTeam: Team | null;
  setSelectedTeam: (team: Team) => void;
  teams: Team[];
  joinTeam: (teamId: string) => void;
}

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [nickname, setNickname] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  const [teams, setTeams] = useState<Team[]>([
    { id: 'crimson', name: 'Team Crimson', color: 'bg-red-600', playerCount: 3, maxPlayers: 7 },
    { id: 'scarlet', name: 'Team Scarlet', color: 'bg-red-500', playerCount: 5, maxPlayers: 7 },
    { id: 'ruby', name: 'Team Ruby', color: 'bg-red-700', playerCount: 2, maxPlayers: 7 },
    { id: 'garnet', name: 'Team Garnet', color: 'bg-red-800', playerCount: 6, maxPlayers: 7 }
  ]);

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

  return (
    <QuizContext.Provider value={{ 
      nickname, 
      setNickname, 
      selectedTeam, 
      setSelectedTeam,
      teams,
      joinTeam
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
