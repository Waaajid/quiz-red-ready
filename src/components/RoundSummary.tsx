
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/hooks/useQuiz";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from 'canvas-confetti';

interface RoundSummaryProps {
  roundNumber: number;
  onNextRound: () => void;
}

interface ConfettiOptions {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  origin?: { x?: number; y?: number };
  particleCount?: number;
  zIndex?: number;
}

const RoundSummary = ({ roundNumber, onNextRound }: RoundSummaryProps) => {
  const { gameSession, isSessionHost } = useQuiz();
  
  // Get round winners from game session
  const roundWinners = gameSession?.roundWinners?.[roundNumber] || [];
  const hasWinners = roundWinners.length > 0;
  
  useEffect(() => {
    if (hasWinners) {
      // Fire confetti when winners are announced
      const count = 200;
      const defaults: ConfettiOptions = {
        origin: { y: 0.7 },
        zIndex: 1000,
      };

      function fire(particleRatio: number, opts: ConfettiOptions) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [hasWinners]);

  // Group answers by team for comparison
  const teamAnswers: Record<string, { answer: string, count: number }[]> = {};
  Object.entries(gameSession?.teams || {}).forEach(([teamId, team]) => {
    const answers = team.answers || {};
    const roundAnswers = Object.entries(answers)
      .filter(([questionId]) => questionId.startsWith(`r${roundNumber}`))
      .map(([_, answers]) => answers)
      .flat();

    // Count frequency of each answer
    const answerCounts = roundAnswers.reduce((acc, answer) => {
      const normalizedAnswer = answer.toLowerCase().trim();
      acc[normalizedAnswer] = (acc[normalizedAnswer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by count
    teamAnswers[team.name] = Object.entries(answerCounts)
      .map(([answer, count]) => ({ answer, count }))
      .filter(({ count }) => count >= 2) // Only show matching answers (2 or more)
      .sort((a, b) => b.count - a.count);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-8 bg-white/10 backdrop-blur-sm rounded-xl"
    >
      <h2 className="text-3xl font-bold text-center mb-8">Round {roundNumber} Complete!</h2>
      
      <AnimatePresence>
        {hasWinners ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <h3 className="text-xl mb-4">🏆 Round {roundNumber} Winner{roundWinners.length > 1 ? 's' : ''}:</h3>
            <div className="space-y-2">
              {roundWinners.map((winner, index) => (
                <motion.div 
                  key={winner}
                  className="inline-block mx-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <span className="text-2xl font-bold text-white">🎉 {winner} 🎉</span>
                </motion.div>
              ))}
            </div>
            {roundWinners.length > 1 && (
              <p className="text-lg mt-4 text-yellow-300">
                Tied for most matching answers!
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <p className="text-xl">No winning team this round</p>
            <p className="text-lg mt-2 text-quiz-red-200">
              Teams need at least 2 matching answers to win
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <h3 className="text-xl font-bold mb-4">Team Performance</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(teamAnswers).map(([teamName, answers]) => {
            const isWinner = roundWinners.includes(teamName);
            return (
              <motion.div 
                key={teamName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-2 ${
                  isWinner 
                    ? 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 border-yellow-500' 
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    {isWinner && <span className="text-yellow-400">👑</span>}
                    {teamName}
                    {isWinner && <span className="text-yellow-400">👑</span>}
                  </h4>
                  {isWinner && (
                    <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      WINNER
                    </span>
                  )}
                </div>
                {answers.length > 0 ? (
                  <ul className="space-y-2">
                    {answers.map(({ answer, count }, index) => (
                      <motion.li 
                        key={answer}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { delay: index * 0.1 }
                        }}
                        className={`flex justify-between items-center px-3 py-2 rounded ${
                          isWinner && index === 0 
                            ? 'bg-yellow-500/20 border border-yellow-500/50' 
                            : 'bg-white/10'
                        }`}
                      >
                        <span className="capitalize">{answer}</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-bold ${
                          isWinner && index === 0 
                            ? 'bg-yellow-500 text-yellow-900' 
                            : 'bg-quiz-red-500 text-white'
                        }`}>
                          {count} match{count > 1 ? 'es' : ''}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/60">No matching answers</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {isSessionHost && (
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onNextRound}
            className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-3 text-lg"
          >
            {roundNumber < 3 ? "Start Next Round" : "View Final Results"}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RoundSummary;
