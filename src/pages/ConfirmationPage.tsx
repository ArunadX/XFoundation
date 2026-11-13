import { useEffect, useState } from 'react';
import type { ConfirmationState, PageRoute } from '../types/olympiad';
import { SuccessCelebrationStage } from '../components/SuccessCelebrationStage';

interface ConfirmationPageProps {
  confirmation: ConfirmationState | null;
  onNavigate: (page: PageRoute) => void;
}

export function ConfirmationPage({ confirmation, onNavigate }: ConfirmationPageProps) {
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    setSecondsLeft(10);
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [confirmation?.referenceId]);

  useEffect(() => {
    if (secondsLeft === 0) {
      onNavigate('home');
    }
  }, [secondsLeft, onNavigate]);

  return (
    <section className="bg-[#06080D] py-14 lg:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SuccessCelebrationStage
          confirmation={confirmation}
          secondsLeft={secondsLeft}
          onNavigate={onNavigate}
        />
      </div>
    </section>
  );
}
