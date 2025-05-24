import { Button } from "@/components/ui/button";
import { useQuiz } from "@/context/QuizContext";

interface RoundSummaryProps {
  roundNumber: number;
  onNextRound: () => void;
}

const RoundSummary = ({ roundNumber, onNextRound }: RoundSummaryProps) => {
  const { gameSession, isSessionHost, getRoundWinner, teamScores } = useQuiz();
  const roundWinner = getRoundWinner(roundNumber);
  
  const matchingAnswers = gameSession?.teams[roundWinner || '']?.answers || {};
  const currentRoundAnswers = Object.entries(matchingAnswers)
    .filter(([questionId]) => questionId.startsWith(`r${roundNumber}`))
    .map(([_, answers]) => answers)
    .flat();

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white/10 backdrop-blur-sm rounded-xl">
      <h2 className="text-3xl font-bold text-center mb-8">Round {roundNumber} Complete!</h2>
      
      {roundWinner ? (
        <div className="text-center mb-8">
          <h3 className="text-xl mb-4">Round Winner:</h3>
          <div className="inline-block px-6 py-3 bg-quiz-red-600 rounded-full">
            <span className="text-2xl font-bold">{roundWinner}</span>
          </div>
          
          <div className="mt-6">
            <h4 className="text-lg mb-2">Matching Answers:</h4>
            <ul className="space-y-2">
              {currentRoundAnswers.map((answer, index) => (
                <li key={index} className="bg-white/5 px-4 py-2 rounded">
                  {answer}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center mb-8">
          <p className="text-xl">No winning team this round</p>
          <p className="text-lg mt-2 text-quiz-red-200">
            Teams need at least 2 matching answers to win
          </p>
        </div>
      )}
      
      {isSessionHost && (
        <div className="text-center">
          <Button
            onClick={onNextRound}
            className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-3 text-xl"
          >
            {roundNumber < 3 ? 'Next Round' : 'View Results'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoundSummary;
