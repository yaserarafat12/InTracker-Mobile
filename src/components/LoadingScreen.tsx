import { Icon } from '@iconify/react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = 'Memuat...' }: LoadingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#E3DAC9] font-['Outfit']">
      <Icon icon="ph:circle-notch-bold" className="text-[#00FF85] animate-spin" width={32} />
      <p className="text-[11px] font-bold text-[#E3DAC9]/40 mt-3 uppercase tracking-wider">
        {message}
      </p>
    </div>
  );
};

export default LoadingScreen;
