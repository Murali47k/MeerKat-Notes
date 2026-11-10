import React, { useState, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

// Generate a synthetic dataset with true quadratic/polynomial trend + noise
const BASE_POINTS: Point[] = [
  { x: 0.5, y: 1.2 },
  { x: 1.0, y: 2.1 },
  { x: 1.8, y: 2.5 },
  { x: 2.5, y: 4.8 },
  { x: 3.2, y: 5.1 },
  { x: 4.0, y: 7.8 },
  { x: 4.8, y: 8.2 },
  { x: 5.5, y: 11.5 },
  { x: 6.2, y: 10.8 },
  { x: 7.0, y: 14.2 },
  { x: 7.8, y: 13.9 },
  { x: 8.5, y: 18.5 },
];

export default function RegularizationComparePlot() {
  const [lambda, setLambda] = useState<number>(1.0);
  const [degree, setDegree] = useState<number>(3);
  const [activeModel, setActiveModel] = useState<'all' | 'ols' | 'ridge' | 'lasso'>('all');
  const [noiseAdded, setNoiseAdded] = useState<boolean>(false);

  // SVG dimensions
  const width = 620;
  const height = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 50 };

  const xMin = 0;
  const xMax = 9;
  const yMin = 0;
  const yMax = 22;

  const toSvgX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
  const toSvgY = (y: number) => height - padding.bottom - ((y - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);

  // Data points with optional high-leverage outlier
  const points = useMemo(() => {
    if (!noiseAdded) return BASE_POINTS;
    return [
      ...BASE_POINTS,
      { x: 8.2, y: 6.0 }, // severe outlier
      { x: 2.0, y: 12.0 }, // severe outlier
    ];
  }, [noiseAdded]);

  // Fit Polynomial Regression with OLS, Ridge, and Lasso
  const models = useMemo(() => {
    const n = points.length;
    const p = degree;

    const X_raw = points.map(pt => {
      const row = [];
      for (let d = 1; d <= p; d++) {
        row.push(Math.pow(pt.x, d));
      }
      return row;
    });
    const y_raw = points.map(pt => pt.y);

    const means: number[] = [];
    const stds: number[] = [];
    for (let j = 0; j < p; j++) {
      const col = X_raw.map(r => r[j]);
      const m = col.reduce((a, b) => a + b, 0) / n;
      const v = Math.sqrt(col.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1;
      means.push(m);
      stds.push(v);
    }
    const yMean = y_raw.reduce((a, b) => a + b, 0) / n;

    const X = X_raw.map(row => row.map((val, j) => (val - means[j]) / stds[j]));
    const y = y_raw.map(val => val - yMean);

    const solveRidge = (regParam: number) => {
      const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
          let sum = 0;
          for (let k = 0; k < n; k++) sum += X[k][i] * X[k][j];
          XtX[i][j] = sum + (i === j ? regParam : 0);
        }
      }

      const Xty: number[] = Array(p).fill(0);
      for (let i = 0; i < p; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) sum += X[k][i] * y[k];
        Xty[i] = sum;
      }

      const A = XtX.map((row, i) => [...row, Xty[i]]);
      for (let i = 0; i < p; i++) {
        let maxRow = i;
        for (let r = i + 1; r < p; r++) {
          if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
        }
        const temp = A[i];
        A[i] = A[maxRow];
        A[maxRow] = temp;

        const pivot = A[i][i];
        if (Math.abs(pivot) < 1e-8) continue;
        for (let c = i; c <= p; c++) A[i][c] /= pivot;
        for (let r = 0; r < p; r++) {
          if (r !== i) {
            const factor = A[r][i];
            for (let c = i; c <= p; c++) {
              A[r][c] -= factor * A[i][c];
            }
          }
        }
      }

      const stdWeights = A.map(row => row[p]);
      const originalWeights = stdWeights.map((w, j) => w / stds[j]);
      let originalIntercept = yMean;
      for (let j = 0; j < p; j++) {
        originalIntercept -= originalWeights[j] * means[j];
      }
      return { weights: originalWeights, intercept: originalIntercept, stdWeights };
    };

    const solveLasso = (regParam: number) => {
      const wStd = Array(p).fill(0);
      const maxIters = 600;
      const colNormsSq = Array(p).fill(0);
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += X[i][j] * X[i][j];
        colNormsSq[j] = sum || 1;
      }

      for (let iter = 0; iter < maxIters; iter++) {
        for (let j = 0; j < p; j++) {
          let rho = 0;
          for (let i = 0; i < n; i++) {
            let predNoJ = 0;
            for (let k = 0; k < p; k++) {
              if (k !== j) predNoJ += X[i][k] * wStd[k];
            }
            rho += X[i][j] * (y[i] - predNoJ);
          }

          const thresh = regParam * n;
          if (rho > thresh) {
            wStd[j] = (rho - thresh) / colNormsSq[j];
          } else if (rho < -thresh) {
            wStd[j] = (rho + thresh) / colNormsSq[j];
          } else {
            wStd[j] = 0;
          }
        }
      }

      const originalWeights = wStd.map((w, j) => w / stds[j]);
      let originalIntercept = yMean;
      for (let j = 0; j < p; j++) {
        originalIntercept -= originalWeights[j] * means[j];
      }
      return { weights: originalWeights, intercept: originalIntercept, stdWeights: wStd };
    };

    const ols = solveRidge(0.0001);
    const ridge = solveRidge(lambda * 15);
    const lasso = solveLasso(lambda * 0.08);

    const computeStats = (model: { weights: number[]; intercept: number; stdWeights: number[] }) => {
      let mse = 0;
      for (const pt of points) {
        let pred = model.intercept;
        for (let d = 1; d <= p; d++) {
          pred += model.weights[d - 1] * Math.pow(pt.x, d);
        }
        mse += (pt.y - pred) ** 2;
      }
      mse /= n;
      const l1Norm = model.stdWeights.reduce((acc, w) => acc + Math.abs(w), 0);
      const l2NormSq = model.stdWeights.reduce((acc, w) => acc + w ** 2, 0);
      const zeroCount = model.stdWeights.filter(w => Math.abs(w) < 1e-4).length;
      return { ...model, mse, l1Norm, l2NormSq, zeroCount };
    };

    return {
      ols: computeStats(ols),
      ridge: computeStats(ridge),
      lasso: computeStats(lasso),
    };
  }, [points, degree, lambda]);

  const generatePath = (model: { weights: number[]; intercept: number }) => {
    const steps = 60;
    const pathSegments: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      let y = model.intercept;
      for (let d = 1; d <= degree; d++) {
        y += model.weights[d - 1] * Math.pow(x, d);
      }
      const clampedY = Math.max(yMin - 5, Math.min(yMax + 5, y));
      const px = toSvgX(x);
      const py = toSvgY(clampedY);
      pathSegments.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pathSegments.join(' ');
  };

  const olsPath = useMemo(() => generatePath(models.ols), [models.ols, degree]);
  const ridgePath = useMemo(() => generatePath(models.ridge), [models.ridge, degree]);
  const lassoPath = useMemo(() => generatePath(models.lasso), [models.lasso, degree]);

  return (
    <div className="my-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs font-sans">
      {/* Header bar */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Interactive Benchmark: OLS vs Ridge vs Lasso
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare model sensitivity, coefficient shrinkage, and sparsity as regularisation strength increases.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          {(['all', 'ols', 'ridge', 'lasso'] as const).map(m => (
            <button
              key={m}
              onClick={() => setActiveModel(m)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeModel === m
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'all' ? 'All Three' : m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Control sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Lambda Slider */}
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-slate-700">
              Regularisation Penalty (&lambda;)
            </label>
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              &lambda; = {lambda.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="10.0"
            step="0.1"
            value={lambda}
            onChange={e => setLambda(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0.0 (OLS)</span>
            <span>5.0</span>
            <span>10.0 (Strong)</span>
          </div>
        </div>

        {/* Polynomial Degree Slider */}
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-slate-700">
              Polynomial Degree
            </label>
            <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              Degree = {degree} ({degree} weights)
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={degree}
            onChange={e => setDegree(parseInt(e.target.value, 10))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>1 (Linear)</span>
            <span>2 (Quadratic)</span>
            <span>3 (Cubic)</span>
            <span>4 (Overfit)</span>
          </div>
        </div>

        {/* Extreme Outlier Stress Test */}
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 flex flex-col justify-between">
          <div className="text-xs font-medium text-slate-700 mb-1">
            Stress Test: High-Leverage Outliers
          </div>
          <button
            onClick={() => setNoiseAdded(!noiseAdded)}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              noiseAdded
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {noiseAdded ? 'Remove 2 Outlier Points' : 'Inject 2 Extreme Outliers'}
          </button>
          <span className="text-[10px] text-slate-400 mt-1">
            Observe how OLS violently shifts while regularised models remain stable.
          </span>
        </div>
      </div>

      {/* SVG Plot Canvas (Consistent clean light aesthetic matching chapter 1) */}
      <div className="relative mt-2 flex justify-center bg-blue-50/20 rounded-xl p-3 border border-blue-100 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[620px] select-none">
          {/* Grid lines */}
          {[0, 2, 4, 6, 8].map(x => (
            <line
              key={`gx-${x}`}
              x1={toSvgX(x)}
              y1={padding.top}
              x2={toSvgX(x)}
              y2={height - padding.bottom}
              stroke="#e2e8f0"
              strokeDasharray="2 3"
            />
          ))}
          {[0, 5, 10, 15, 20].map(y => (
            <line
              key={`gy-${y}`}
              x1={padding.left}
              y1={toSvgY(y)}
              x2={width - padding.right}
              y2={toSvgY(y)}
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

          {/* X ticks & labels */}
          {[0, 2, 4, 6, 8].map(x => (
            <text
              key={`tx-${x}`}
              x={toSvgX(x)}
              y={height - padding.bottom + 18}
              textAnchor="middle"
              className="text-[11px] fill-slate-500 font-mono"
            >
              {x}
            </text>
          ))}
          <text
            x={padding.left + (width - padding.left - padding.right) / 2}
            y={height - 10}
            className="text-[11px] fill-slate-600 font-medium"
            textAnchor="middle"
          >
            Feature x
          </text>

          {/* Y ticks & labels */}
          {[0, 5, 10, 15, 20].map(y => (
            <text
              key={`ty-${y}`}
              x={padding.left - 10}
              y={toSvgY(y) + 4}
              textAnchor="end"
              className="text-[11px] fill-slate-500 font-mono"
            >
              {y}
            </text>
          ))}
          <text
            transform={`rotate(-90 ${padding.left - 34} ${padding.top + (height - padding.top - padding.bottom) / 2})`}
            x={padding.left - 34}
            y={padding.top + (height - padding.top - padding.bottom) / 2}
            className="text-[11px] fill-slate-600 font-medium"
            textAnchor="middle"
          >
            Target y
          </text>

          {/* Model Curves */}
          {/* 1. OLS Curve (Red Dashed) */}
          {(activeModel === 'all' || activeModel === 'ols') && (
            <path
              d={olsPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth={activeModel === 'ols' ? '3' : '2'}
              strokeDasharray={activeModel === 'all' ? '5 3' : 'none'}
              opacity={activeModel === 'all' ? '0.85' : '1'}
            />
          )}

          {/* 2. Ridge Curve (Blue Solid) */}
          {(activeModel === 'all' || activeModel === 'ridge') && (
            <path
              d={ridgePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth={activeModel === 'ridge' ? '3' : '2.5'}
              opacity="0.95"
            />
          )}

          {/* 3. Lasso Curve (Green Dot-Dash) */}
          {(activeModel === 'all' || activeModel === 'lasso') && (
            <path
              d={lassoPath}
              fill="none"
              stroke="#059669"
              strokeWidth={activeModel === 'lasso' ? '3' : '2.5'}
              strokeDasharray={activeModel === 'all' ? '4 2' : 'none'}
              opacity="0.95"
            />
          )}

          {/* Scatter Points */}
          {points.map((pt, idx) => {
            const isOutlier = noiseAdded && idx >= BASE_POINTS.length;
            return (
              <g key={`pt-${idx}`}>
                <circle
                  cx={toSvgX(pt.x)}
                  cy={toSvgY(pt.y)}
                  r={isOutlier ? '6' : '5'}
                  fill={isOutlier ? '#f43f5e' : '#2563eb'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {isOutlier && (
                  <circle
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r="9"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Box */}
        <div className="absolute top-5 right-6 bg-white/95 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 shadow-sm space-y-1.5">
          <div className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
            Model Hypotheses
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-red-500 inline-block"></span>
            <span className="font-mono text-[11px]">OLS (No penalty)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-blue-600 inline-block"></span>
            <span className="font-mono text-[11px]">Ridge (L2 penalty)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-b-2 border-dotted border-emerald-600 inline-block"></span>
            <span className="font-mono text-[11px]">Lasso (L1 penalty)</span>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* OLS Card */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            activeModel === 'ols' || activeModel === 'all'
              ? 'bg-red-50/40 border-red-200'
              : 'opacity-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700">OLS (Ordinary Least Squares)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800">
              &lambda; = 0
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Train MSE:</span>
              <span className="font-mono font-semibold">{models.ols.mse.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weight L2 Norm ||w||₂:</span>
              <span className="font-mono">{Math.sqrt(models.ols.l2NormSq).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Exact 0 Weights:</span>
              <span className="font-mono text-slate-400">0 of {degree}</span>
            </div>
          </div>
        </div>

        {/* Ridge Card */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            activeModel === 'ridge' || activeModel === 'all'
              ? 'bg-blue-50/40 border-blue-200'
              : 'opacity-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">Ridge (L2 Regularised)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              Shrinkage
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Train MSE:</span>
              <span className="font-mono font-semibold">{models.ridge.mse.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weight L2 Norm ||w||₂:</span>
              <span className="font-mono font-semibold text-blue-600">
                {Math.sqrt(models.ridge.l2NormSq).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Exact 0 Weights:</span>
              <span className="font-mono text-slate-400">0 of {degree} (never sparse)</span>
            </div>
          </div>
        </div>

        {/* Lasso Card */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            activeModel === 'lasso' || activeModel === 'all'
              ? 'bg-emerald-50/40 border-emerald-200'
              : 'opacity-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Lasso (L1 Regularised)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Sparsity
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Train MSE:</span>
              <span className="font-mono font-semibold">{models.lasso.mse.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weight L1 Norm ||w||₁:</span>
              <span className="font-mono">{models.lasso.l1Norm.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Eliminated (Zero):</span>
              <span className="font-mono font-bold text-emerald-700">
                {models.lasso.zeroCount} of {degree} features
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
