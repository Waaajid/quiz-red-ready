
import { useState } from 'react';
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
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  
  const handleTimerComplete = () => {
    if (!isAnswered) {
      setTimerComplete(true);
    }
  };
  
  const handleSubmit = () => {
    if (!isAnswered && (answer.trim() || timerComplete)) {
      setIsAnswered(true);
      onSubmit(answer.trim(), timeLeft);
    }
  };
  
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
          seconds={timerSeconds} 
          onComplete={handleTimerComplete} 
        />
        
        <div className="space-y-4 pt-4">
          <Input
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => !isAnswered && setAnswer(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            disabled={isAnswered}
          />
          
          <Button
            onClick={handleSubmit}
            disabled={isAnswered}
            className={`w-full ${
              isAnswered 
                ? 'bg-quiz-red-600 opacity-50' 
                : 'bg-quiz-red-600 hover:bg-quiz-red-700'
            }`}
          >
            {timerComplete || isAnswered ? "Next" : "Submit Answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
