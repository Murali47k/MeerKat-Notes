import React, { useState } from 'react';

export default function GradientDescentPlot() {
  const [learningRate, setLearningRate] = useState<number>(0.15);
  const [w, setW] = useState<number>(-2.8);
  const [history, setHistory] = useState<number[]>([-2.8]);

  // Objective function: J(w) = w^2 + 2
  // Derivative: dJ/dw = 2*w
  const computeLoss = (val: number) => Math.pow(val, 2) + 2;
  const computeGradient = (val: number) => 2 * val;

  const stepDescent = () => {
    const grad = computeGradient(w);
    const nextW = parseFloat((w - learningRate * grad).toFixed(3));
    setW(nextW);
    setHistory((prev) => [...prev.slice(-15), nextW]);
  };

  const reset = () => {
    setW(-2.8);
    setHistory([-2.8]);
  };

  // SVG scaling
  const width = 500;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };

  const xMin = -3.5;
  const xMax = 3.5;
  const yMin = 0;
  const yMax = 15;

  const toSvgX = (xVal: number) =>
    padding.left + ((xVal - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
  const toSvgY = (yVal: number) =>
    height - padding.bottom - ((yVal - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);

  // Generate curve path points
  const curvePoints = [];
  for (let xVal = xMin; xVal <= xMax; xVal += 0.1) {
    curvePoints.push(`${toSvgX(xVal)},${toSvgY(computeLoss(xVal))}`);
  }
  const pathD = `M ${curvePoints.join(' L ')}`;

  const currentLoss = computeLoss(w);
  const currentGrad = computeGradient(w);

  return (
    <div className="my-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-50">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
            Parameter Optimization
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1.5">Loss Surface & Gradient Descent Trajectory</h3>
          <p className="text-xs text-slate-500 font-mono">
            Observe how parameter updates follow $w := w - \alpha \nabla J(w)$ towards the minimum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={stepDescent}
            className="text-xs font-mono px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs flex items-center gap-1.5 font-medium cursor-pointer"
          >
            Take Step (α = {learningRate})
          </button>
          <button
            onClick={reset}
            className="text-xs font-mono px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex justify-center bg-blue-50/30 rounded-xl p-3 border border-blue-100">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[520px] select-none">
          {/* Parabolic Loss Curve */}
          <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" />

          {/* Axes */}
          <line
            x1={padding.left}
            y1={toSvgY(0)}
            x2={width - padding.right}
            y2={toSvgY(0)}
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          <line
            x1={toSvgX(0)}
            y1={padding.top}
            x2={toSvgX(0)}
            y2={height - padding.bottom}
            stroke="#cbd5e1"
            strokeDasharray="2 2"
          />

          {/* History path */}
          {history.length > 1 && (
            <polyline
              points={history.map((hw) => `${toSvgX(hw)},${toSvgY(computeLoss(hw))}`).join(' ')}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* History points */}
          {history.slice(0, -1).map((hw, idx) => (
            <circle
              key={idx}
              cx={toSvgX(hw)}
              cy={toSvgY(computeLoss(hw))}
              r="3.5"
              fill="#93c5fd"
              opacity="0.8"
            />
          ))}

          {/* Current parameter ball */}
          <circle
            cx={toSvgX(w)}
            cy={toSvgY(currentLoss)}
            r="6"
            fill="#1d4ed8"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* Labels */}
          <text
            x={width - padding.right}
            y={toSvgY(0) + 16}
            textAnchor="end"
            className="text-[10px] font-mono fill-slate-500"
          >
            Parameter w
          </text>
          <text
            x={padding.left + 5}
            y={padding.top + 12}
            textAnchor="start"
            className="text-[10px] font-mono fill-slate-500"
          >
            Loss J(w)
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-blue-50">
        <div>
          <div className="flex justify-between items-center text-xs font-mono text-slate-700 mb-1.5">
            <span>Learning Rate (α)</span>
            <span className="font-bold text-blue-600">{learningRate}</span>
          </div>
          <input
            type="range"
            min="0.02"
            max="1.1"
            step="0.02"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
            <span>Slow</span>
            <span>Optimal (~0.2)</span>
            <span>Overshoot (&gt;1.0)</span>
          </div>
        </div>

        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-xs font-mono">
          <div className="text-slate-500">Current Parameter (w):</div>
          <div className="font-bold text-blue-900 mt-0.5">{w.toFixed(3)}</div>
          <div className="text-slate-400 text-[11px] mt-1">Gradient: {currentGrad.toFixed(3)}</div>
        </div>

        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 text-xs font-mono">
          <div className="text-slate-500">Loss J(w):</div>
          <div
            className={`font-bold mt-0.5 ${
              Math.abs(w) < 0.1 ? 'text-blue-600' : 'text-slate-900'
            }`}
          >
            {currentLoss.toFixed(3)}
          </div>
          <div className="text-slate-400 text-[11px] mt-1">Steps taken: {history.length - 1}</div>
        </div>
      </div>
    </div>
  );
}
