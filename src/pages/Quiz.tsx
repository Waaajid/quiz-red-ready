
import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Quiz = () => {
  const { nickname, selectedTeam } = useQuiz();
  const navigate = useNavigate();
  
  // Redirect to home if no nickname or team is set
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    } else if (!selectedTeam) {
      navigate("/team-selection");
    }
  }, [nickname, selectedTeam, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Quiz Game</h2>
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
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to the Quiz, {nickname}!</h1>
          {selectedTeam && (
            <p className="text-xl max-w-md mx-auto">
              You're now part of <span className="font-bold">{selectedTeam.name}</span>. 
              The quiz will be implemented in the next phase.
            </p>
          )}
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="bg-transparent border-white text-white hover:bg-white/20"
          >
            Return to Welcome Screen
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
