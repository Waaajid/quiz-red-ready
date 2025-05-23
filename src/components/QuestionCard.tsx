
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CountdownTimer from './CountdownTimer';

interface QuestionCardProps {
  questionNumber: number;
  questionText: string;
  onSubmit: (answer: string, timeRemaining: number) => void;
  timerSeconds: number;
}

const QuestionCard = ({ 
  questionNumber, 
  questionText,
  onSubmit,
  timerSeconds
}: QuestionCardProps) => {
  const [answer, setAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);
  
  // Reset states when question changes
  useEffect(() => {
    setAnswer('');
    setIsAnswered(false);
    setTimerComplete(false);
    setCanProceed(false);
    setTimeRemaining(timerSeconds);
  }, [questionNumber, questionText, timerSeconds]);
  
  const handleTimerComplete = () => {
    setTimerComplete(true);
    if (!isAnswered) {
      // Auto-submit empty answer when timer completes
      handleSubmit();
    }
  };
  
  const handleSubmit = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      onSubmit(answer.trim(), timeRemaining);
      
      // If timer hasn't completed yet, wait for it
      if (!timerComplete) {
        // Timer will continue running and enable "Next" when it completes
        return;
      } else {
        // Timer already completed, can proceed immediately
        setCanProceed(true);
      }
    }
  };
  
  const handleNext = () => {
    if (canProceed || timerComplete) {
      // The parent component will handle moving to next question
      onSubmit(answer.trim(), timeRemaining);
    }
  };
  
  // Enable "Next" button when timer completes (whether answered or not)
  useEffect(() => {
    if (timerComplete) {
      setCanProceed(true);
    }
  }, [timerComplete]);
  
  return (
    <Card className="w-full bg-white/10 backdrop-blur-sm border-none shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="text-center mb-4">
          <div className="inline-block bg-quiz-red-500 text-white px-4 py-2 rounded-full font-bold mb-3">
            Question {questionNumber}
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">{questionText}</h3>
        </div>
        
        <CountdownTimer 
          key={`${questionNumber}-${questionText}`}
          seconds={timerSeconds} 
          onComplete={handleTimerComplete}
          onTick={setTimeRemaining}
        />
        
        <div className="space-y-4 pt-4">
          <Input
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => !isAnswered && setAnswer(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            disabled={isAnswered && canProceed}
          />
          
          <Button
            onClick={isAnswered ? handleNext : handleSubmit}
            disabled={isAnswered && !canProceed}
            className={`w-full ${
              (isAnswered && !canProceed)
                ? 'bg-quiz-red-600 opacity-50' 
                : 'bg-quiz-red-600 hover:bg-quiz-red-700'
            }`}
          >
            {isAnswered ? (canProceed ? "Next" : `Wait ${Math.max(0, timeRemaining)}s...`) : "Submit Answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
