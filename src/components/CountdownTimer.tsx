
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
}

const CountdownTimer = ({ seconds, onComplete }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (timeLeft <= 0 && !isComplete) {
      setIsComplete(true);
      onComplete();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete, isComplete]);
  
  const progressValue = Math.max(0, (timeLeft / seconds) * 100);
  
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span>Time remaining</span>
        <span className="font-medium">{timeLeft}s</span>
      </div>
      <Progress 
        value={progressValue} 
        className="h-2 bg-quiz-red-900"
      />
    </div>
  );
};

export default CountdownTimer;
