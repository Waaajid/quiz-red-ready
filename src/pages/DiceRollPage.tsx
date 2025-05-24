import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useQuiz } from '@/hooks/useQuiz';

const DiceRollPage: React.FC = () => {
  const navigate = useNavigate();
  const { nickname, selectedTeam, getDiceRolls } = useQuiz();
  const [isRolling, setIsRolling] = useState(false);
  const [rollsRemaining, setRollsRemaining] = useState(
    selectedTeam ? getDiceRolls(selectedTeam.name) : 0
  );
  const [currentRoll, setCurrentRoll] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleRoll = () => {
    if (rollsRemaining > 0) {
      setIsRolling(true);
      const result = Math.floor(Math.random() * 6) + 1;
      setCurrentRoll(result);
      
      // Simulate roll animation
      setTimeout(() => {
        setIsRolling(false);
        setRollsRemaining(prev => prev - 1);
        setTotalScore(prev => prev + result);
        
        if (rollsRemaining === 1) {
          setTimeout(() => {
            setShowResults(true);
          }, 1000);
        }
      }, 1000);
    }
  };

  const diceDisplay = (value: number) => {
    const dots = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return dots[value - 1];
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white"
    >
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Bonus Dice Roll</h2>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 px-4 py-2 rounded-full">
              <span className="font-medium">Playing as: </span>
              <span className="font-bold">{nickname}</span>
            </div>
            {selectedTeam && (
              <div className={`${selectedTeam.color} px-4 py-2 rounded-full`}>
                <span className="font-medium text-white">{selectedTeam.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-md mb-8">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center"
            animate={isRolling ? {
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="text-8xl select-none">
              {diceDisplay(currentRoll)}
            </span>
          </motion.div>
        </div>

        <div className="text-center space-y-6">
          <div className="space-y-2">
            <motion.p 
              key={rollsRemaining}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              className="text-2xl font-bold"
            >
              Rolls Remaining: {rollsRemaining}
            </motion.p>
            <motion.p 
              key={totalScore}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              className="text-xl"
            >
              Total Score: {totalScore}
            </motion.p>
          </div>

          {showResults ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                <h3 className="text-3xl font-bold mb-4">Final Score: {totalScore}</h3>
                <p className="text-xl">Congratulations on completing the quiz!</p>
              </div>
              <Button
                onClick={() => navigate('/')}
                className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white px-8 py-3 text-lg"
              >
                Play Again
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={handleRoll}
              disabled={isRolling || rollsRemaining === 0}
              className={`bg-quiz-red-500 hover:bg-quiz-red-600 text-white px-8 py-3 text-lg transition-all transform hover:scale-105 ${
                isRolling ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </Button>
          )}
        </div>
      </main>
    </motion.div>
  );
};

export default DiceRollPage;
