interface AudioVisualizationProps {
  isActive: boolean;
  inputVolume?: number;
  outputVolume?: number;
}

export default function AudioVisualization({ isActive, inputVolume = 0, outputVolume = 0 }: AudioVisualizationProps) {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-end space-x-1 h-16">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`wave-bar w-2 bg-accent/60 rounded-full transition-all duration-150 ${
              isActive ? 'animate-wave opacity-100' : 'opacity-30'
            }`}
            style={{
              height: isActive 
                ? `${20 + Math.random() * 28}px` 
                : '20px',
              animationDelay: `${i * 150}ms`
            }}
            data-testid={`audio-bar-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
