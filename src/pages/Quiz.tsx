
import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const Quiz = () => {
  const { nickname } = useQuiz();
  const navigate = useNavigate();
  
  // Redirect to home if no nickname is set
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    }
  }, [nickname, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Quiz Game</h2>
          <div className="bg-white/20 px-4 py-2 rounded-full">
            <span className="font-medium">Playing as: </span>
            <span className="font-bold">{nickname}</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to the Quiz, {nickname}!</h1>
          <p className="text-xl max-w-md mx-auto">
            The quiz will be implemented in the next phase. 
            For now, you can return to the welcome screen.
          </p>
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
