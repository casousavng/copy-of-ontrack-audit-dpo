import React from 'react';

interface ScoreGaugeProps {
  score: number; // 0 to 100
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 200 }) => {
  const radius = size * 0.4;
  const stroke = size * 0.1;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Color interpolation based on score
  let color = '#EF4444'; // Red
  if (normalizedScore > 50) color = '#F59E0B'; // Yellow
  if (normalizedScore > 80) color = '#10B981'; // Green

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        height={size / 2 + stroke}
        width={size}
        viewBox={`0 0 ${size} ${size / 2 + stroke}`}
        className="overflow-visible"
      >
        {/* Background Arc */}
        <path
          d={`M ${stroke},${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke},${size / 2}`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          d={`M ${stroke},${size / 2} A ${radius} ${radius} 0 0 1 ${size - stroke},${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute top-[40%] text-center">
        <span className="text-3xl font-bold text-gray-800">{score.toFixed(1)}%</span>
      </div>
    </div>
  );
};