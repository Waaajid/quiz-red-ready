
import { Button } from "@/components/ui/button";
import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";

const QuizComplete = () => {
  const { nickname, selectedTeam, userAnswers, questions, resetQuiz } = useQuiz();
  const navigate = useNavigate();
  
  const handlePlayAgain = () => {
    resetQuiz();
    navigate("/");
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        Quiz Complete! 
      </h2>
      
      <div className="space-y-6 mb-8">
        <div className="text-center">
          <p className="text-2xl mb-2">Great job, <span className="font-bold">{nickname}</span>!</p>
          <p className="text-xl">
            You've completed all rounds of the quiz with{" "}
            <span className={`font-bold ${selectedTeam?.color} bg-opacity-70 px-2 py-1 rounded`}>
              {selectedTeam?.name}
            </span>
          </p>
        </div>
        
        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-center">Your Quiz Summary</h3>
          
          <div className="space-y-6">
            {[1, 2, 3].map(roundId => (
              <div key={roundId} className="border-b border-white/20 pb-4 last:border-0">
                <h4 className="text-lg font-medium mb-3">Round {roundId}:</h4>
                <ul className="space-y-2">
                  {questions
                    .filter(q => q.roundId === roundId)
                    .map(question => {
                      const answer = userAnswers.find(a => a.questionId === question.id);
                      return (
                        <li key={question.id} className="flex justify-between">
                          <span className="text-white/80">{question.text}</span>
                          <span className="font-medium">
                            {answer?.answer || "No answer"}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center pt-4">
        <Button 
          onClick={handlePlayAgain}
          className="bg-quiz-red-500 hover:bg-quiz-red-600 text-white font-bold px-8 py-3 text-lg"
        >
          Play Again
        </Button>
      </div>
    </div>
  );
};

export default QuizComplete;
