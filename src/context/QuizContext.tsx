
import { createContext, useContext, useState, ReactNode } from 'react';

interface QuizContextProps {
  nickname: string;
  setNickname: (nickname: string) => void;
}

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider = ({ children }: { children: ReactNode }) => {
  const [nickname, setNickname] = useState<string>('');

  return (
    <QuizContext.Provider value={{ nickname, setNickname }}>
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
