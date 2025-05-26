
import { useQuiz } from "@/hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import QuestionCard from "@/components/QuestionCard";
import RoundSummary from "@/components/RoundSummary";
import QuizComplete from "@/components/QuizComplete";
import { advanceToNextQuestion, submitAnswer as submitToFirebase } from "@/services/gameSession";

const Quiz = () => {
  const { 
    nickname, 
    selectedTeam,
    questions,
    currentRound,
    setCurrentRound,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    submitPlayerAnswer,
    processRoundResults,
    quizCompleted,
    setQuizCompleted,
    gameSession,
    isSessionHost,
    sessionError
  } = useQuiz();
  
  const navigate = useNavigate();
  
  const [showingSummary, setShowingSummary] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [waitingForHost, setWaitingForHost] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Filter questions for current round
  const roundQuestions = questions.filter(q => q.roundId === currentRound);
  const currentQuestion = roundQuestions[currentQuestionIndex];
  
  // Calculate progress
  const totalQuestions = questions.length;
  const questionsPerRound = roundQuestions.length;
  const completedQuestions = (currentRound - 1) * questionsPerRound + currentQuestionIndex;
  const progressPercentage = (completedQuestions / totalQuestions) * 100;
  
  // Monitor game session state
  useEffect(() => {
    if (!gameSession && !sessionError) {
      return;
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      navigate("/team-selection");
      return;
    }

    if (gameSession) {
      const { currentState, currentRound: sessionRound, currentQuestionIndex: sessionQuestionIndex, status } = gameSession;

      // Check if game has started
      const started = status === 'started' || status === 'in-progress';
      setGameStarted(started);
      setWaitingForHost(!started);

      if (started) {
        if (sessionRound && sessionRound !== currentRound) {
          setCurrentRound(sessionRound);
        }
        
        if (typeof sessionQuestionIndex === 'number' && sessionQuestionIndex !== currentQuestionIndex) {
          setCurrentQuestionIndex(sessionQuestionIndex);
          setQuestionKey(prev => prev + 1);
        }
        
        switch (currentState.phase) {
          case 'answering': {
            setShowingSummary(false);
            break;
          }
          case 'round-end': {
            setShowingSummary(true);
            if (isSessionHost) {
              processRoundResults(currentRound);
            }
            break;
          }
          case 'completed': {
            setQuizCompleted(true);
            break;
          }
        }
      }
    }
  }, [
    gameSession,
    currentRound,
    currentQuestionIndex,
    setCurrentRound,
    setCurrentQuestionIndex,
    navigate,
    setQuizCompleted,
    isSessionHost,
    sessionError,
    processRoundResults
  ]);

  // Redirect if not properly set up
  useEffect(() => {
    if (!nickname) {
      navigate("/");
    } else if (!selectedTeam || (!gameSession && sessionError)) {
      navigate("/team-selection");
    } else if (gameSession) {
      const currentPlayer = gameSession.players[nickname];
      const team = gameSession.teams[currentPlayer?.teamId];
      if (!currentPlayer?.teamId || !team) {
        navigate("/team-selection");
      }
    }
  }, [nickname, selectedTeam, gameSession, navigate, sessionError]);

  const handleAnswerSubmit = async (answer: string, timeRemaining: number) => {
    if (!currentQuestion || !selectedTeam || !gameSession) return;

    try {
      // Submit answer to Firebase
      if (answer) {
        await submitToFirebase(gameSession.id, nickname, currentQuestion.id, answer, timeRemaining);
        
        submitPlayerAnswer({
          teamName: selectedTeam.name,
          roundNumber: currentRound,
          questionId: currentQuestion.id,
          answer: answer
        });
      }

      // If host, advance to next question
      if (isSessionHost) {
        await advanceToNextQuestion(gameSession.id, currentRound, currentQuestionIndex);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  const handleNextRound = async () => {
    try {
      if (currentRound < 3) {
        const nextRound = currentRound + 1;
        
        setCurrentRound(nextRound);
        setCurrentQuestionIndex(0);
        setShowingSummary(false);
        setQuestionKey(prev => prev + 1);
      } else {
        setQuizCompleted(true);
      }
    } catch (error) {
      console.error('Error advancing round:', error);
    }
  };

  // Show waiting screen if game hasn't started
  if (waitingForHost && !gameStarted) {
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
        
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h1 className="text-3xl font-bold mb-4">Waiting for host to start the game...</h1>
            <p className="text-xl text-white/80">
              Please wait while the host starts the quiz.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
              key={questionKey}
              questionNumber={currentQuestionIndex + 1}
              questionText={currentQuestion.text}
              onSubmit={handleAnswerSubmit}
              timerSeconds={12}
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
