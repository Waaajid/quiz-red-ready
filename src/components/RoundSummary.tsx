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
  const { gameSession, isSessionHost, getRoundWinner } = useQuiz();
  const roundWinner = getRoundWinner(roundNumber);
  
  useEffect(() => {
    if (roundWinner) {
      // Fire confetti
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
  }, [roundWinner]);

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
      acc[answer] = (acc[answer] || 0) + 1;
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
        {roundWinner ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <h3 className="text-xl mb-4">Round Winner:</h3>
            <motion.div 
              className="inline-block px-8 py-4 bg-quiz-red-600 rounded-full"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-3xl font-bold">{roundWinner}</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <p className="text-xl">No winning team this round</p>
            <p className="text-lg mt-2 text-quiz-red-200">
              Teams need at least 2 matching answers to win
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <h3 className="text-xl font-bold mb-4">Team Answers</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(teamAnswers).map(([teamName, answers]) => (
            <motion.div 
              key={teamName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 p-4 rounded-lg"
            >
              <h4 className="font-semibold mb-2">{teamName}</h4>
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
                      className="flex justify-between items-center bg-white/10 px-3 py-2 rounded"
                    >
                      <span>{answer}</span>
                      <span className="bg-quiz-red-500 px-2 py-1 rounded-full text-sm">
                        {count} matches
                      </span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60">No matching answers</p>
              )}
            </motion.div>
          ))}
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
            {roundNumber < 3 ? "Next Round" : "View Final Results"}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default RoundSummary;
