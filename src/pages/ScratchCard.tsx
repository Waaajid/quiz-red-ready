
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScratchCardProps {
  isWinning: boolean;
  onReveal: (isWinning: boolean) => void;
  isRevealed: boolean;
}

const ScratchCardComponent = ({ isWinning, onReveal, isRevealed }: ScratchCardProps) => {
  const [isScratched, setIsScratched] = useState(false);

  const handleScratch = () => {
    if (!isScratched && !isRevealed) {
      setIsScratched(true);
      setTimeout(() => {
        onReveal(isWinning);
      }, 500);
    }
  };

  return (
    <div 
      className={`relative w-32 h-32 rounded-lg cursor-pointer transition-all duration-500 ${
        isScratched || isRevealed ? 'transform scale-105' : 'hover:scale-105'
      }`}
      onClick={handleScratch}
    >
      {!isScratched && !isRevealed ? (
        // Unscratched card
        <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center border-2 border-gray-500">
          <Gift className="h-8 w-8 text-white" />
        </div>
      ) : (
        // Revealed card
        <div className={`w-full h-full rounded-lg flex items-center justify-center text-white font-bold text-sm text-center p-2 ${
          isWinning ? 'bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-red-500 to-red-700'
        }`}>
          {isWinning ? "You can log out at 1 PM!" : "Better luck next time!"}
        </div>
      )}
    </div>
  );
};

const ScratchCard = () => {
  const navigate = useNavigate();
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [revealedCards, setRevealedCards] = useState<boolean[]>([]);
  const [gameComplete, setGameComplete] = useState(false);

  // Define winning patterns for each attempt
  const getWinningPattern = (attempt: number): boolean[] => {
    switch (attempt) {
      case 1:
      case 2:
        return [true, false, false]; // 1 winning card
      case 3:
        return [true, true, false]; // 2 winning cards
      default:
        return [false, false, false];
    }
  };

  const currentPattern = getWinningPattern(currentAttempt);

  const handleCardReveal = (cardIndex: number, isWinning: boolean) => {
    const newRevealed = [...revealedCards];
    newRevealed[cardIndex] = true;
    setRevealedCards(newRevealed);

    // Check if all cards are revealed
    if (newRevealed.length === 3 && newRevealed.every(card => card)) {
      setTimeout(() => {
        if (currentAttempt < 3) {
          // Move to next attempt
          setCurrentAttempt(currentAttempt + 1);
          setRevealedCards([]);
        } else {
          // Game complete
          setGameComplete(true);
        }
      }, 2000);
    }
  };

  const resetGame = () => {
    setCurrentAttempt(1);
    setRevealedCards([]);
    setGameComplete(false);
  };

  const handleBackToDashboard = () => {
    navigate("/host-dashboard");
  };

  if (gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white flex items-center justify-center">
        <Card className="bg-white/10 border-white/20 p-8 text-center max-w-md">
          <CardContent className="space-y-6">
            <div className="text-6xl">🎉</div>
            <h1 className="text-2xl font-bold">Scratch Card Game Complete!</h1>
            <p className="text-white/80">
              All three attempts have been completed. Thank you for participating!
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetGame}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Play Again
              </Button>
              <Button
                onClick={handleBackToDashboard}
                className="bg-quiz-red-500 hover:bg-quiz-red-600"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-quiz-red-700 to-quiz-red-900 text-white">
      <header className="p-4 border-b border-white/10">
        <div className="container">
          <h1 className="text-2xl font-bold">Scratch Card Game</h1>
        </div>
      </header>

      <main className="container p-6 flex items-center justify-center min-h-[80vh]">
        <Card className="bg-white/10 border-white/20 p-8 text-center max-w-lg">
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Attempt {currentAttempt} of 3</h2>
              <p className="text-white/80">
                Choose a card to scratch and reveal your prize!
              </p>
              {currentAttempt === 3 && (
                <p className="text-yellow-400 font-semibold">
                  Final attempt - better odds!
                </p>
              )}
            </div>

            <div className="flex justify-center gap-6">
              {[0, 1, 2].map((cardIndex) => (
                <ScratchCardComponent
                  key={`${currentAttempt}-${cardIndex}`}
                  isWinning={currentPattern[cardIndex]}
                  onReveal={(isWinning) => handleCardReveal(cardIndex, isWinning)}
                  isRevealed={revealedCards[cardIndex] || false}
                />
              ))}
            </div>

            <div className="text-sm text-white/60">
              {revealedCards.filter(Boolean).length} / 3 cards revealed
            </div>

            <Button
              onClick={handleBackToDashboard}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/20"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ScratchCard;
