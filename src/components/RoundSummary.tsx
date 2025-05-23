
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/context/QuizContext";

interface RoundSummaryProps {
  roundNumber: number;
  onNextRound: () => void;
}

const RoundSummary = ({ roundNumber, onNextRound }: RoundSummaryProps) => {
  const { userAnswers, questions } = useQuiz();
  
  const roundQuestions = questions.filter(q => q.roundId === roundNumber);
  const roundAnswers = userAnswers.filter(a => 
    roundQuestions.some(q => q.id === a.questionId)
  );
  
  return (
    <div className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        Round {roundNumber} Complete!
      </h2>
      
      <div className="space-y-6 mb-8">
        <p className="text-center text-lg">
          You've answered all questions for this round. Your answers have been submitted!
        </p>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Your Answers:</h3>
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
