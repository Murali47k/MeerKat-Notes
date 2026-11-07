import React, { useState, useMemo } from 'react';

interface Point {
  id: number;
  x: number;
  y: number;
}

const DEFAULT_POINTS: Point[] = [
  { id: 1, x: 1.0, y: 3.2 },
  { id: 2, x: 2.0, y: 4.8 },
  { id: 3, x: 3.0, y: 7.5 },
  { id: 4, x: 4.0, y: 8.8 },
  { id: 5, x: 5.0, y: 12.1 },
  { id: 6, x: 6.0, y: 13.9 },
  { id: 7, x: 7.0, y: 16.2 },
  { id: 8, x: 8.5, y: 19.4 },
];

export default function RegressionPlot() {
  const [points, setPoints] = useState<Point[]>(DEFAULT_POINTS);
  const [slope, setSlope] = useState<number>(1.8);
  const [intercept, setIntercept] = useState<number>(1.0);
  const [showResiduals, setShowResiduals] = useState<boolean>(true);

  // SVG dimensions & coordinate scale
  const width = 580;
  const height = 340;
  const padding = { top: 25, right: 30, bottom: 45, left: 50 };

  const xMax = 10;
  const yMax = 25;

  const toSvgX = (x: number) => padding.left + (x / xMax) * (width - padding.left - padding.right);
  const toSvgY = (y: number) => height - padding.bottom - (y / yMax) * (height - padding.top - padding.bottom);
  const fromSvgX = (px: number) => ((px - padding.left) / (width - padding.left - padding.right)) * xMax;
  const fromSvgY = (py: number) => ((height - padding.bottom - py) / (height - padding.top - padding.bottom)) * yMax;

  // Calculate Optimal OLS Solution
  const optimal = useMemo(() => {
    const n = points.length;
    if (n === 0) return { slope: 0, intercept: 0, mse: 0 };
    const xMean = points.reduce((acc, p) => acc + p.x, 0) / n;
    const yMean = points.reduce((acc, p) => acc + p.y, 0) / n;

    let num = 0;
    let den = 0;
    for (const p of points) {
      num += (p.x - xMean) * (p.y - yMean);
      den += (p.x - xMean) ** 2;
    }
    const optSlope = den === 0 ? 0 : num / den;
    const optIntercept = yMean - optSlope * xMean;

    const optMse = points.reduce((acc, p) => {
      const pred = optSlope * p.x + optIntercept;
      return acc + (p.y - pred) ** 2;
    }, 0) / n;

    return { slope: optSlope, intercept: optIntercept, mse: optMse };
  }, [points]);

  // Current MSE
  const currentMse = useMemo(() => {
    if (points.length === 0) return 0;
    const sumSq = points.reduce((acc, p) => {
      const pred = slope * p.x + intercept;
      return acc + (p.y - pred) ** 2;
    }, 0);
    return sumSq / points.length;
  }, [points, slope, intercept]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
      clickX >= padding.left &&
      clickX <= width - padding.right &&
      clickY >= padding.top &&
      clickY <= height - padding.bottom
    ) {
      const newX = parseFloat(fromSvgX(clickX).toFixed(1));
      const newY = parseFloat(fromSvgY(clickY).toFixed(1));
      setPoints([...points, { id: Date.now(), x: newX, y: newY }]);
    }
  };

  const applyOptimal = () => {
    setSlope(parseFloat(optimal.slope.toFixed(2)));
    setIntercept(parseFloat(optimal.intercept.toFixed(2)));
  };

  const resetPoints = () => {
    setPoints(DEFAULT_POINTS);
    setSlope(1.8);
    setIntercept(1.0);
  };

  return (
    <div className="my-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-50">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
            Interactive Experiment
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1.5">Linear Regression & Residual Minimization</h3>
          <p className="text-xs text-slate-500 font-mono">
            Adjust slope ($b_1$) and intercept ($b_0$) to minimize Mean Squared Error. Click chart to add data points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={applyOptimal}
            className="text-xs font-mono px-3.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-xs font-medium cursor-pointer"
          >
            Snap to OLS Fit
          </button>
          <button
            onClick={resetPoints}
            className="text-xs font-mono px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-4 flex justify-center bg-blue-50/30 rounded-xl p-3 border border-blue-100 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[620px] select-none cursor-crosshair"
          onClick={handleSvgClick}
        >
          {/* Grid lines */}
          {[0, 2, 4, 6, 8, 10].map((gx) => (
            <line
              key={`gx-${gx}`}
              x1={toSvgX(gx)}
              y1={padding.top}
              x2={toSvgX(gx)}
              y2={height - padding.bottom}
              stroke="#e2e8f0"
              strokeDasharray="2 3"
            />
          ))}
          {[0, 5, 10, 15, 20, 25].map((gy) => (
            <line
              key={`gy-${gy}`}
              x1={padding.left}
              y1={toSvgY(gy)}
              x2={width - padding.right}
              y2={toSvgY(gy)}
              stroke="#e2e8f0"
              strokeDasharray="2 3"
            />
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Tick marks and labels */}
          {[0, 2, 4, 6, 8, 10].map((gx) => (
            <text
              key={`tx-${gx}`}
              x={toSvgX(gx)}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              className="text-[11px] fill-slate-500 font-mono"
            >
              {gx}
            </text>
          ))}
          {[0, 5, 10, 15, 20, 25].map((gy) => (
            <text
              key={`ty-${gy}`}
              x={padding.left - 10}
              y={toSvgY(gy) + 4}
              textAnchor="end"
              className="text-[11px] fill-slate-500 font-mono"
            >
              {gy}
            </text>
          ))}

          {/* Residual lines (errors) */}
          {showResiduals &&
            points.map((p) => {
              const yPred = slope * p.x + intercept;
              return (
                <line
                  key={`res-${p.id}`}
                  x1={toSvgX(p.x)}
                  y1={toSvgY(p.y)}
                  x2={toSvgX(p.x)}
                  y2={toSvgY(yPred)}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.85"
                />
              );
            })}

          {/* Fitted Regression Line: y = slope * x + intercept */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(intercept)}
            x2={toSvgX(xMax)}
            y2={toSvgY(slope * xMax + intercept)}
            stroke="#2563eb"
            strokeWidth="2.75"
          />

          {/* Data Points */}
          {points.map((p) => (
            <circle
              key={p.id}
              cx={toSvgX(p.x)}
              cy={toSvgY(p.y)}
              r="5.5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
              className="transition-all hover:scale-125"
            />
          ))}

          {/* Axis Titles */}
          <text
            x={width - padding.right}
            y={height - padding.bottom - 8}
            textAnchor="end"
            className="text-[11px] font-mono fill-slate-600 font-medium"
          >
            x (feature)
          </text>
          <text
            x={padding.left + 10}
            y={padding.top + 12}
            textAnchor="start"
            className="text-[11px] font-mono fill-slate-600 font-medium"
          >
            y (target)
          </text>
        </svg>
      </div>

      {/* Control Sliders and Equation display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-blue-50">
        <div>
          <div className="flex justify-between items-center text-xs font-mono text-slate-700 mb-1.5">
            <span>Slope (b₁)</span>
            <span className="font-bold text-blue-600">{slope.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="4.0"
            step="0.05"
            value={slope}
            onChange={(e) => setSlope(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-xs font-mono text-slate-700 mb-1.5">
            <span>Intercept (b₀)</span>
            <span className="font-bold text-blue-600">{intercept.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-5.0"
            max="15.0"
            step="0.2"
            value={intercept}
            onChange={(e) => setIntercept(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        <div className="flex flex-col justify-center bg-blue-50/50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Current MSE:</span>
            <span
              className={`font-bold ${
                Math.abs(currentMse - optimal.mse) < 0.2 ? 'text-blue-600' : 'text-rose-600'
              }`}
            >
              {currentMse.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono mt-1 text-slate-400">
            <span>Optimal (OLS):</span>
            <span className="text-blue-800 font-semibold">{optimal.mse.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs font-mono text-slate-500">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showResiduals}
            onChange={(e) => setShowResiduals(e.target.checked)}
            className="rounded text-red-500 focus:ring-red-400 accent-red-500"
          />
          <span>Show Residuals (Squared Errors)</span>
        </label>
        <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-medium">
          Model: ŷ = {intercept >= 0 ? `${slope.toFixed(2)}x + ${intercept.toFixed(2)}` : `${slope.toFixed(2)}x - ${Math.abs(intercept).toFixed(2)}`}
        </span>
      </div>
    </div>
  );
}
