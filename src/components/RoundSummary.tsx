
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/context/QuizContext";

interface RoundSummaryProps {
  roundNumber: number;
  onNextRound: () => void;
}

const RoundSummary = ({ roundNumber, onNextRound }: RoundSummaryProps) => {
  const { 
    userAnswers, 
    questions, 
    roundResults,
    getRoundWinner,
    selectedTeam 
  } = useQuiz();
  
  const roundQuestions = questions.filter(q => q.roundId === roundNumber);
  const roundAnswers = userAnswers.filter(a => 
    roundQuestions.some(q => q.id === a.questionId)
  );
  
  const currentRoundResult = roundResults.find(r => r.roundNumber === roundNumber);
  const winningTeam = getRoundWinner(roundNumber);
  const isWinner = selectedTeam && winningTeam === selectedTeam.name;
  
  return (
    <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        Round {roundNumber} Complete!
      </h2>
      
      <div className="space-y-6 mb-8">
        {currentRoundResult && selectedTeam && (
          <div className="bg-white/5 p-4 rounded-lg text-center">
            {currentRoundResult.matchedAnswers[selectedTeam.name]?.length > 0 ? (
              isWinner ? (
                <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-lg">
                  <h3 className="text-2xl font-bold text-green-400 mb-2">Congratulations!</h3>
                  <p className="text-lg">Your team had the most matching answers this round!</p>
                </div>
              ) : (
                <p className="text-lg">
                  {winningTeam} won this round with the most matching answers!
                </p>
              )
            ) : (
              <div className="bg-yellow-500/20 border border-yellow-500/50 p-4 rounded-lg">
                <p className="text-lg">
                  No matching answers yet! You need at least 2 players from your team to give the same answer.
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Round Summary:</h3>
          {currentRoundResult && selectedTeam && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Your Team's Matching Answers:</h4>
              {currentRoundResult.matchedAnswers[selectedTeam.name]?.map((match, index) => (
                <div key={index} className="bg-white/10 p-3 rounded mb-2">
                  <p className="font-medium">Answer: "{match.answer}"</p>
                  <p className="text-sm opacity-80">{match.count} team members matched</p>
                </div>
              ))}
            </div>
          )}
          <h3 className="text-xl font-semibold mb-4 mt-6">Your Answers:</h3>
          <ul className="space-y-3">
            {roundQuestions.map((question, index) => {
              const answer = roundAnswers.find(a => a.questionId === question.id);
              return (
                <li key={question.id} className="flex items-start space-x-2">
                  <span className="bg-quiz-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-sm mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-white/80">{question.text}</p>
                    <p className="font-medium">
                      {answer?.answer || "No answer provided"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      
      <div className="text-center">
        <Button 
          onClick={onNextRound}
          className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-3 text-lg"
        >
          {roundNumber === 3 ? "See Final Results" : "Next Round"}
        </Button>
      </div>
    </div>
  );
};

export default RoundSummary;
