import React, { useState, useMemo } from 'react';

export default function ContourConstraintPlot() {
  // Constrained radius / diamond vertex size determined by penalty / budget t
  const [budgetT, setBudgetT] = useState<number>(1.2);
  const [penaltyType, setPenaltyType] = useState<'both' | 'l1' | 'l2'>('both');
  const [olsTarget, setOlsTarget] = useState<{ w1: number; w2: number }>({ w1: 1.8, w2: 1.4 });

  // Canvas dimensions
  const width = 560;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 80; // 80px per unit of w

  const toSvgX = (w1: number) => cx + w1 * scale;
  const toSvgY = (w2: number) => cy - w2 * scale;

  // Compute the point on the L2 constraint ball that touches the MSE ellipses first
  // For isotropic/elliptical loss around (w1_ols, w2_ols), the point of tangency:
  const l2Tangent = useMemo(() => {
    const dist = Math.sqrt(olsTarget.w1 ** 2 + olsTarget.w2 ** 2);
    if (dist <= budgetT) {
      return { w1: olsTarget.w1, w2: olsTarget.w2 };
    }
    const factor = budgetT / dist;
    return { w1: olsTarget.w1 * factor, w2: olsTarget.w2 * factor };
  }, [budgetT, olsTarget]);

  // For L1 constraint diamond (|w1| + |w2| <= t), compute the intersection with expanding loss ellipses
  // In typical configurations where OLS is off-axis, the expanding ellipse strikes a corner (w1=0 or w2=0)
  // unless the ellipse axis aligns identically with the diamond edge.
  const l1Tangent = useMemo(() => {
    const sumAbs = Math.abs(olsTarget.w1) + Math.abs(olsTarget.w2);
    if (sumAbs <= budgetT) {
      return { w1: olsTarget.w1, w2: olsTarget.w2 };
    }
    // High probability corner hit:
    // When w1 is larger than w2, the contour touches (t * sgn(w1), 0)
    // When w2 is larger, it touches (0, t * sgn(w2))
    if (Math.abs(olsTarget.w1) >= Math.abs(olsTarget.w2)) {
      return { w1: Math.sign(olsTarget.w1) * budgetT, w2: 0 };
    } else {
      return { w1: 0, w2: Math.sign(olsTarget.w2) * budgetT };
    }
  }, [budgetT, olsTarget]);

  // Elliptical contours of MSE loss: J(w) = 1/2 [ 1.5*(w1 - w1*)^2 + 0.8*(w2 - w2*)^2 + 0.4*(w1-w1*)(w2-w2*) ]
  const ellipseContours = useMemo(() => {
    // Generate 5 concentric ellipses centered at (w1*, w2*)
    const radii = [0.4, 0.8, 1.25, 1.7, 2.2];
    return radii.map(r => {
      const rx = r * scale * 1.15;
      const ry = r * scale * 0.75;
      const angle = -25; // rotated elliptical contours representing correlated features
      return { rx, ry, angle };
    });
  }, [scale]);

  return (
    <div className="my-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-indigo-500"></span>
            Geometric Intuition: Why Lasso Yields Exact Sparsity
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Visualise constrained optimisation: minimising MSE loss subject to |w₁| + |w₂| &le; t (L1 diamond) or w₁² + w₂² &le; t² (L2 sphere).
          </p>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
          {(['both', 'l1', 'l2'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPenaltyType(p)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                penaltyType === p
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {p === 'both' ? 'Compare Both' : p === 'l1' ? 'L1 Diamond (Lasso)' : 'L2 Ball (Ridge)'}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Constraint Budget / Radius t (Inverse of &lambda;)
            </label>
            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
              t = {budgetT.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.2"
            step="0.05"
            value={budgetT}
            onChange={e => setBudgetT(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
            <span>Small t (Large &lambda;)</span>
            <span>Medium t</span>
            <span>Large t (OLS reached)</span>
          </div>
        </div>

        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Target OLS Minimum w*<sub>OLS</sub>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              ({olsTarget.w1.toFixed(1)}, {olsTarget.w2.toFixed(1)})
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setOlsTarget({ w1: 1.8, w2: 1.4 })}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                olsTarget.w1 === 1.8
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-400 text-indigo-800 dark:text-indigo-300 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              General Pos. (1.8, 1.4)
            </button>
            <button
              onClick={() => setOlsTarget({ w1: 2.1, w2: 0.6 })}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                olsTarget.w1 === 2.1
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-400 text-indigo-800 dark:text-indigo-300 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              Dominant Feature 1 (2.1, 0.6)
            </button>
          </div>
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
          <defs>
            {/* Gradients */}
            <radialGradient id="contourGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* Grid lines */}
          {[-2, -1, 1, 2].map(v => (
            <React.Fragment key={`grid-${v}`}>
              <line
                x1={toSvgX(v)}
                y1={0}
                x2={toSvgX(v)}
                y2={height}
                stroke="#27272a"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={0}
                y1={toSvgY(v)}
                x2={width}
                y2={toSvgY(v)}
                stroke="#27272a"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}

          {/* Coordinate Axes */}
          <line x1={0} y1={cy} x2={width} y2={cy} stroke="#71717a" strokeWidth="1.5" />
          <line x1={cx} y1={0} x2={cx} y2={height} stroke="#71717a" strokeWidth="1.5" />

          {/* Axis Labels */}
          <text x={width - 25} y={cy - 10} fill="#e4e4e7" fontSize="12" fontWeight="bold" fontFamily="monospace">
            w₁
          </text>
          <text x={cx + 10} y={22} fill="#e4e4e7" fontSize="12" fontWeight="bold" fontFamily="monospace">
            w₂
          </text>

          {/* OLS Unconstrained Optimum */}
          <g transform={`translate(${toSvgX(olsTarget.w1)}, ${toSvgY(olsTarget.w2)})`}>
            {/* Concentric MSE Contours (Ellipses) */}
            {ellipseContours.map((c, i) => (
              <ellipse
                key={`ellipse-${i}`}
                cx="0"
                cy="0"
                rx={c.rx}
                ry={c.ry}
                transform={`rotate(${c.angle})`}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray={i === 0 ? 'none' : '4 3'}
                opacity={0.4 + i * 0.12}
              />
            ))}
            {/* Center marker */}
            <circle cx="0" cy="0" r="4.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
            <text x="8" y="-6" fill="#fca5a5" fontSize="11" fontWeight="bold">
              w_OLS (Unconstrained)
            </text>
          </g>

          {/* L2 Ridge Constraint Region (Circle / Sphere) */}
          {(penaltyType === 'both' || penaltyType === 'l2') && (
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={budgetT * scale}
                fill="#38bdf8"
                fillOpacity="0.14"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* L2 Tangency point */}
              <circle
                cx={toSvgX(l2Tangent.w1)}
                cy={toSvgY(l2Tangent.w2)}
                r="6"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <line
                x1={toSvgX(l2Tangent.w1)}
                y1={toSvgY(l2Tangent.w2)}
                x2={toSvgX(l2Tangent.w1) + (l2Tangent.w1 < 0 ? -25 : 25)}
                y2={toSvgY(l2Tangent.w2) - 25}
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x={toSvgX(l2Tangent.w1) + (l2Tangent.w1 < 0 ? -120 : 30)}
                y={toSvgY(l2Tangent.w2) - 28}
                fill="#7dd3fc"
                fontSize="11"
                fontWeight="bold"
              >
                Ridge w*: ({l2Tangent.w1.toFixed(2)}, {l2Tangent.w2.toFixed(2)})
              </text>
            </g>
          )}

          {/* L1 Lasso Constraint Region (Diamond: |w1| + |w2| <= t) */}
          {(penaltyType === 'both' || penaltyType === 'l1') && (
            <g>
              {/* Diamond polygon */}
              <polygon
                points={`
                  ${cx},${toSvgY(budgetT)}
                  ${toSvgX(budgetT)},${cy}
                  ${cx},${toSvgY(-budgetT)}
                  ${toSvgX(-budgetT)},${cy}
                `}
                fill="#34d399"
                fillOpacity="0.18"
                stroke="#34d399"
                strokeWidth="2.5"
              />
              {/* Corner highlighted vertices */}
              <circle cx={toSvgX(budgetT)} cy={cy} r="3" fill="#34d399" />
              <circle cx={toSvgX(-budgetT)} cy={cy} r="3" fill="#34d399" />
              <circle cx={cx} cy={toSvgY(budgetT)} r="3" fill="#34d399" />
              <circle cx={cx} cy={toSvgY(-budgetT)} r="3" fill="#34d399" />

              {/* L1 Tangency point (Corner Hit) */}
              <circle
                cx={toSvgX(l1Tangent.w1)}
                cy={toSvgY(l1Tangent.w2)}
                r="6.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <line
                x1={toSvgX(l1Tangent.w1)}
                y1={toSvgY(l1Tangent.w2)}
                x2={toSvgX(l1Tangent.w1) + 25}
                y2={toSvgY(l1Tangent.w2) + 30}
                stroke="#10b981"
                strokeWidth="1"
              />
              <text
                x={toSvgX(l1Tangent.w1) + 30}
                y={toSvgY(l1Tangent.w2) + 34}
                fill="#6ee7b7"
                fontSize="11"
                fontWeight="bold"
              >
                Lasso w*: ({l1Tangent.w1.toFixed(2)}, {l1Tangent.w2.toFixed(2)}){' '}
                {l1Tangent.w2 === 0 ? '→ w₂ set to exactly 0!' : '→ w₁ set to exactly 0!'}
              </text>
            </g>
          )}
        </svg>

        {/* Informative Legend */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-300 flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block"></span>
            <span>
              <strong>Lasso Diamond (L1):</strong> Has sharp corners precisely on the axes. The expanding elliptical MSE contour hits a sharp corner first, locking that coordinate to <strong>exact 0</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-400 inline-block"></span>
            <span>
              <strong>Ridge Circle (L2):</strong> Smooth and differentiable everywhere. The tangency point with the ellipse almost never lies on an axis, shrinking weights without setting them to zero.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
