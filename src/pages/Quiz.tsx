
import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import QuestionCard from "@/components/QuestionCard";
import RoundSummary from "@/components/RoundSummary";
import QuizComplete from "@/components/QuizComplete";

const Quiz = () => {
  const { 
    nickname, 
    selectedTeam,
    questions,
    currentRound,
    setCurrentRound,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    submitAnswer,
    quizCompleted,
    setQuizCompleted
  } = useQuiz();
  
  const navigate = useNavigate();
  
  // States for the component
  const [showingSummary, setShowingSummary] = useState(false);
  
  // Filter questions for current round
  const roundQuestions = questions.filter(q => q.roundId === currentRound);
  const currentQuestion = roundQuestions[currentQuestionIndex];
  
  // Calculate progress
  const totalQuestions = questions.length;
  const questionsPerRound = roundQuestions.length;
  const completedQuestions = (currentRound - 1) * questionsPerRound + currentQuestionIndex;
  const progressPercentage = (completedQuestions / totalQuestions) * 100;
  
  // Redirect to home if no nickname or team is set
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    } else if (!selectedTeam) {
      navigate("/team-selection");
    }
  }, [nickname, selectedTeam, navigate]);

  const handleAnswerSubmit = (answer: string, timeRemaining: number) => {
    if (currentQuestion) {
      submitAnswer(currentQuestion.id, answer, timeRemaining);
      
      // Short delay before moving to next question
      setTimeout(() => {
        if (currentQuestionIndex < questionsPerRound - 1) {
          // Go to next question in the round
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // Round complete - show summary
          setShowingSummary(true);
        }
      }, 500);
    }
  };
  
  const handleNextRound = () => {
    if (currentRound < 3) {
      setCurrentRound(currentRound + 1);
      setCurrentQuestionIndex(0);
      setShowingSummary(false);
    } else {
      // Quiz complete
      setQuizCompleted(true);
    }
  };

  // If quiz is completed, show completion screen
  if (quizCompleted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
        <header className="p-4 border-b border-white/10">
          <div className="container flex justify-between items-center">
            <h2 className="font-semibold">Quiz Game - Results</h2>
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
        
        <main className="flex-1 flex items-center justify-center p-6">
          <QuizComplete />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      {/* Progress Bar */}
      <div className="w-full bg-quiz-red-800 p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Round {currentRound} - Question {currentQuestionIndex + 1} of {questionsPerRound}
            </span>
            <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-quiz-red-900"
          />
        </div>
      </div>

      <header className="p-4 border-b border-white/10">
        <div className="container flex justify-between items-center">
          <h2 className="font-semibold">Quiz Game - Round {currentRound}</h2>
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
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {showingSummary ? (
            <RoundSummary 
              roundNumber={currentRound} 
              onNextRound={handleNextRound} 
            />
          ) : currentQuestion ? (
            <QuestionCard
              questionNumber={currentQuestionIndex + 1}
              questionText={currentQuestion.text}
              onSubmit={handleAnswerSubmit}
              timerSeconds={10}
            />
          ) : (
            <div className="text-center">
              <p className="text-xl mb-4">No questions available.</p>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20"
              >
                Return to Welcome Screen
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Quiz;
