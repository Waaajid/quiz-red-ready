import { useQuiz } from "@/context/QuizContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import QuestionCard from "@/components/QuestionCard";
import RoundSummary from "@/components/RoundSummary";
import QuizComplete from "@/components/QuizComplete";
import { updateGameState } from "@/services/gameSession";

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
    submitPlayerAnswer,
    processRoundResults,
    getRoundWinner,
    quizCompleted,
    setQuizCompleted,
    // Multiplayer additions
    gameSession,
    isSessionHost,
    sessionError
  } = useQuiz();
  
  const navigate = useNavigate();
  
  const [showingSummary, setShowingSummary] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  
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
      // Only redirect if there's no session and no error (initial load)
      return;
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      navigate("/team-selection");
      return;
    }

    // Update local game state based on session
    if (gameSession) {
      const { currentState, currentRound: sessionRound, currentQuestionIndex: sessionQuestionIndex } = gameSession;

      // Update round if changed
      if (sessionRound && sessionRound !== currentRound) {
        setCurrentRound(sessionRound);
      }
      
      // Update question if changed
      if (typeof sessionQuestionIndex === 'number' && sessionQuestionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(sessionQuestionIndex);
        setQuestionKey(prev => prev + 1);
      }
      
      // Handle phase changes
      switch (currentState.phase) {
        case 'team-selection': {
          navigate("/team-selection");
          break;
        }
        case 'answering': {
          setShowingSummary(false);
          // Check if all teams have answered current question
          const questionKey = `r${sessionRound}q${sessionQuestionIndex + 1}`;
          const allTeamsAnswered = Object.values(gameSession.teams).every(team => {
            return team.answers && team.answers[questionKey]?.length > 0;
          });
          setWaitingForOthers(!allTeamsAnswered);
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
    }
  }, [nickname, selectedTeam, gameSession, navigate, sessionError]);

  const handleAnswerSubmit = async (answer: string, timeRemaining: number) => {
    if (!currentQuestion || !selectedTeam || !gameSession) return;

    try {
      // If answer is empty and timeRemaining is 0, this is a "Next" action
      if (!answer && timeRemaining === 0) {
        // Only host advances the game state
        if (isSessionHost) {
          let nextState;
          if (currentQuestionIndex < questionsPerRound - 1) {
            nextState = {
              phase: 'answering',
              currentQuestionIndex: currentQuestionIndex + 1
            };
          } else {
            nextState = {
              phase: 'round-end'
            };
            processRoundResults(currentRound);
          }
          
          // Update the game session state
          await updateGameState(gameSession.id, nextState);
        }
        return;
      }

      // Submit answer both locally and to session
      submitAnswer(currentQuestion.id, answer, timeRemaining);
      
      submitPlayerAnswer({
        teamName: selectedTeam.name,
        roundNumber: currentRound,
        questionId: currentQuestion.id,
        answer: answer
      });
      
      setWaitingForOthers(true);

      // Update game session with the new answer
      await updateGameState(gameSession.id, {
        phase: 'answering',
        currentQuestionIndex: currentQuestionIndex
      });

      // Check if all teams have answered
      const allTeamsAnswered = Object.values(gameSession.teams).every(team => {
        const questionKey = `r${currentRound}q${currentQuestionIndex + 1}`;
        return team.answers && team.answers[questionKey]?.length > 0;
      });

      // Only the host advances the game state when everyone has answered
      if (isSessionHost && allTeamsAnswered) {
        let nextState;
        if (currentQuestionIndex < questionsPerRound - 1) {
          nextState = {
            phase: 'answering',
            currentQuestionIndex: currentQuestionIndex + 1
          };
        } else {
          nextState = {
            phase: 'round-end'
          };
          processRoundResults(currentRound);
        }
        
        // Update the game session state
        await updateGameState(gameSession.id, nextState);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  const handleNextRound = async () => {
    try {
      if (currentRound < 3) {
        const nextRound = currentRound + 1;
        
        // Update local state
        setCurrentRound(nextRound);
        setCurrentQuestionIndex(0);
        setShowingSummary(false);
        setQuestionKey(prev => prev + 1);
        
        // Update game session if host
        if (isSessionHost && gameSession) {
          await updateGameState(gameSession.id, {
            phase: 'answering',
            currentRound: nextRound,
            currentQuestionIndex: 0
          });
        }
      } else {
        // Quiz complete
        setQuizCompleted(true);
        if (isSessionHost && gameSession) {
          await updateGameState(gameSession.id, {
            phase: 'completed'
          });
        }
      }
    } catch (error) {
      console.error('Error advancing round:', error);
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
              key={questionKey}
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
