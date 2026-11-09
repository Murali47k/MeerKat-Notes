import React, { useState, useMemo } from 'react';

interface Point {
  x: number;
  y: number;
}

// Generate a synthetic dataset with true quadratic/polynomial trend + noise
// To clearly showcase underfitting vs overfitting vs regularisation
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
  const width = 640;
  const height = 380;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };

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

  // Fit Polynomial Regression with OLS, Ridge, and Lasso via coordinate descent / normal equation
  const models = useMemo(() => {
    const n = points.length;
    const p = degree; // degree features: x^1, x^2, ..., x^p

    // Standardize features for fair regularization
    const X_raw = points.map(pt => {
      const row = [];
      for (let d = 1; d <= p; d++) {
        row.push(Math.pow(pt.x, d));
      }
      return row;
    });
    const y_raw = points.map(pt => pt.y);

    // Feature means & standard deviations
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

    // Standardized design matrix
    const X = X_raw.map(row => row.map((val, j) => (val - means[j]) / stds[j]));
    const y = y_raw.map(val => val - yMean);

    // Helper: Matrix transpose and multiplication
    // 1. OLS Analytical: (X^T X + eps I)^-1 X^T y
    const solveRidge = (regParam: number) => {
      // Form X^T X + regParam * I
      const XtX: number[][] = Array.from({ length: p }, () => Array(p).fill(0));
      for (let i = 0; i < p; i++) {
        for (let j = 0; j < p; j++) {
          let sum = 0;
          for (let k = 0; k < n; k++) sum += X[k][i] * X[k][j];
          XtX[i][j] = sum + (i === j ? regParam : 0);
        }
      }

      // X^T y
      const Xty: number[] = Array(p).fill(0);
      for (let i = 0; i < p; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) sum += X[k][i] * y[k];
        Xty[i] = sum;
      }

      // Solve 2x2, 3x3, 4x4 or 5x5 linear system via Gauss-Jordan elimination
      const A = XtX.map((row, i) => [...row, Xty[i]]);
      for (let i = 0; i < p; i++) {
        // Pivot
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
      // Convert standardized weights back to original unstandardized scale
      const originalWeights = stdWeights.map((w, j) => w / stds[j]);
      let originalIntercept = yMean;
      for (let j = 0; j < p; j++) {
        originalIntercept -= originalWeights[j] * means[j];
      }
      return { weights: originalWeights, intercept: originalIntercept, stdWeights };
    };

    // 2. Lasso via Coordinate Descent (Shooting Algorithm)
    const solveLasso = (regParam: number) => {
      const wStd = Array(p).fill(0);
      const maxIters = 600;
      // Precompute column norms squared
      const colNormsSq = Array(p).fill(0);
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += X[i][j] * X[i][j];
        colNormsSq[j] = sum || 1;
      }

      for (let iter = 0; iter < maxIters; iter++) {
        for (let j = 0; j < p; j++) {
          // Compute partial residual without feature j
          let rho = 0;
          for (let i = 0; i < n; i++) {
            let predNoJ = 0;
            for (let k = 0; k < p; k++) {
              if (k !== j) predNoJ += X[i][k] * wStd[k];
            }
            rho += X[i][j] * (y[i] - predNoJ);
          }

          // Soft-thresholding operator S(rho, lambda)
          const thresh = regParam * n; // scaled for sample size
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

    // Solve OLS (lambda = 0.0001 for numerical stability)
    const ols = solveRidge(0.0001);
    // Solve Ridge (lambda scaled)
    const ridge = solveRidge(lambda * 15);
    // Solve Lasso (lambda scaled)
    const lasso = solveLasso(lambda * 0.08);

    // Compute MSE and L1/L2 penalties
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

  // Generate smooth curve points for SVG path
  const generatePath = (model: { weights: number[]; intercept: number }) => {
    const steps = 60;
    const pathSegments: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      let y = model.intercept;
      for (let d = 1; d <= degree; d++) {
        y += model.weights[d - 1] * Math.pow(x, d);
      }
      // Clamped to display window
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
    <div className="my-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Interactive Benchmark: OLS vs Ridge vs Lasso
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Compare model sensitivity, coefficient shrinkage, and sparsity as regularisation strength increases.
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {(['all', 'ols', 'ridge', 'lasso'] as const).map(m => (
            <button
              key={m}
              onClick={() => setActiveModel(m)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeModel === m
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {m === 'all' ? 'All Three' : m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main interactive controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Lambda Slider */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Regularisation Penalty (&lambda;)
            </label>
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
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
            className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
            <span>0.0 (OLS limit)</span>
            <span>5.0</span>
            <span>10.0 (Heavy penalty)</span>
          </div>
        </div>

        {/* Polynomial Degree */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Polynomial Degree (Features)
            </label>
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
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
            className="w-full accent-amber-600 dark:accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
            <span>1 (Linear)</span>
            <span>2 (Quadratic)</span>
            <span>3 (Cubic)</span>
            <span>4 (Overfit)</span>
          </div>
        </div>

        {/* Data toggle */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50 flex flex-col justify-between">
          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Stress Test: High-Leverage Outliers
          </div>
          <button
            onClick={() => setNoiseAdded(!noiseAdded)}
            className={`w-full py-1.5 px-3 rounded text-xs font-medium transition-colors border ${
              noiseAdded
                ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-zinc-200/70 text-zinc-800 border-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-600 hover:bg-zinc-300/70'
            }`}
          >
            {noiseAdded ? 'Remove 2 Outlier Points' : 'Inject 2 Extreme Outliers'}
          </button>
          <span className="text-[10px] text-zinc-400 mt-1">
            Observe how OLS violently shifts while Ridge and Lasso remain stable.
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-900 dark:border-zinc-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
          {/* Grid lines */}
          {[0, 2, 4, 6, 8].map(x => (
            <line
              key={`gx-${x}`}
              x1={toSvgX(x)}
              y1={padding.top}
              x2={toSvgX(x)}
              y2={height - padding.bottom}
              stroke="#27272a"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}
          {[0, 5, 10, 15, 20].map(y => (
            <line
              key={`gy-${y}`}
              x1={padding.left}
              y1={toSvgY(y)}
              x2={width - padding.right}
              y2={toSvgY(y)}
              stroke="#27272a"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ))}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#52525b"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#52525b"
            strokeWidth="1.5"
          />

          {/* X ticks & labels */}
          {[0, 2, 4, 6, 8].map(x => (
            <g key={`tx-${x}`}>
              <line
                x1={toSvgX(x)}
                y1={height - padding.bottom}
                x2={toSvgX(x)}
                y2={height - padding.bottom + 5}
                stroke="#71717a"
              />
              <text
                x={toSvgX(x)}
                y={height - padding.bottom + 18}
                fill="#a1a1aa"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {x}
              </text>
            </g>
          ))}
          <text
            x={padding.left + (width - padding.left - padding.right) / 2}
            y={height - 10}
            fill="#d4d4d8"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            Feature x
          </text>

          {/* Y ticks & labels */}
          {[0, 5, 10, 15, 20].map(y => (
            <g key={`ty-${y}`}>
              <line
                x1={padding.left - 5}
                y1={toSvgY(y)}
                x2={padding.left}
                y2={toSvgY(y)}
                stroke="#71717a"
              />
              <text
                x={padding.left - 10}
                y={toSvgY(y) + 3}
                fill="#a1a1aa"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {y}
              </text>
            </g>
          ))}
          <text
            transform={`rotate(-90 ${padding.left - 36} ${padding.top + (height - padding.top - padding.bottom) / 2})`}
            x={padding.left - 36}
            y={padding.top + (height - padding.top - padding.bottom) / 2}
            fill="#d4d4d8"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
          >
            Target y
          </text>

          {/* Model Curves */}
          {/* 1. OLS Curve (Red / Pink) */}
          {(activeModel === 'all' || activeModel === 'ols') && (
            <path
              d={olsPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth={activeModel === 'ols' ? '3.5' : '2'}
              strokeDasharray={activeModel === 'all' ? '6 3' : 'none'}
              opacity={activeModel === 'all' ? '0.85' : '1'}
            />
          )}

          {/* 2. Ridge Curve (Blue) */}
          {(activeModel === 'all' || activeModel === 'ridge') && (
            <path
              d={ridgePath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={activeModel === 'ridge' ? '3.5' : '2.5'}
              opacity="0.95"
            />
          )}

          {/* 3. Lasso Curve (Emerald) */}
          {(activeModel === 'all' || activeModel === 'lasso') && (
            <path
              d={lassoPath}
              fill="none"
              stroke="#34d399"
              strokeWidth={activeModel === 'lasso' ? '3.5' : '2.5'}
              strokeDasharray={activeModel === 'all' ? '4 2' : 'none'}
              opacity="0.95"
            />
          )}

          {/* Scatter Data points */}
          {points.map((pt, idx) => {
            const isOutlier = noiseAdded && idx >= BASE_POINTS.length;
            return (
              <g key={`pt-${idx}`}>
                <circle
                  cx={toSvgX(pt.x)}
                  cy={toSvgY(pt.y)}
                  r={isOutlier ? '6' : '4.5'}
                  fill={isOutlier ? '#f43f5e' : '#fbbf24'}
                  stroke="#18181b"
                  strokeWidth="1.5"
                />
                {isOutlier && (
                  <circle
                    cx={toSvgX(pt.x)}
                    cy={toSvgY(pt.y)}
                    r="9"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.8"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute top-3 right-4 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 space-y-1.5 shadow-lg">
          <div className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider mb-1">
            Model Hypotheses
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 border-b-2 border-dashed border-red-500 inline-block"></span>
            <span className="font-mono">OLS (No penalty)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 bg-sky-400 inline-block"></span>
            <span className="font-mono">Ridge (L2 penalty)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 border-b-2 border-dotted border-emerald-400 inline-block"></span>
            <span className="font-mono">Lasso (L1 penalty)</span>
          </div>
        </div>
      </div>

      {/* Comparative Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* OLS Card */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            activeModel === 'ols' || activeModel === 'all'
              ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/40'
              : 'opacity-50 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">OLS (Ordinary Least Squares)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">
              &lambda; = 0
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Train MSE:</span>
              <span className="font-mono font-semibold">{models.ols.mse.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Weight L2 Norm ||w||₂:</span>
              <span className="font-mono">{Math.sqrt(models.ols.l2NormSq).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Exact 0 Weights:</span>
              <span className="font-mono text-zinc-400">0 of {degree}</span>
            </div>
          </div>
        </div>

        {/* Ridge Card */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            activeModel === 'ridge' || activeModel === 'all'
              ? 'bg-sky-50/50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/40'
              : 'opacity-50 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Ridge (L2 Regularised)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300">
              Shrinkage
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Train MSE:</span>
              <span className="font-mono font-semibold">{models.ridge.mse.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Weight L2 Norm ||w||₂:</span>
              <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                {Math.sqrt(models.ridge.l2NormSq).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Exact 0 Weights:</span>
              <span className="font-mono text-zinc-400">0 of {degree} (never sparse)</span>
            </div>
          </div>
        </div>

        {/* Lasso Card */}
        <div
          className={`p-3 rounded-lg border transition-all ${
            activeModel === 'lasso' || activeModel === 'all'
              ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40'
              : 'opacity-50 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Lasso (L1 Regularised)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
              Sparsity
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between">
              <span className="text-zinc-500">Train MSE:</span>
              <span className="font-mono font-semibold">{models.lasso.mse.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Weight L1 Norm ||w||₁:</span>
              <span className="font-mono">{models.lasso.l1Norm.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Eliminated (Zero):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {models.lasso.zeroCount} of {degree} features
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
