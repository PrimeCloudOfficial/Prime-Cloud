import { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
}

export default function TypingText({ text, delay = 30, onComplete }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete]);

  return (
    <>
      {displayedText.split('').map((char, i) => (
        <span
          key={i}
          style={{
            color: Math.random() > 0.5 ? '#00ff9d' : '#ffffff',
          }}
        >
          {char}
        </span>
      ))}
    </>
  );
}
