import React, { useState } from 'react';

export default function ShrinkageInteractive() {
  const [lambda, setLambda] = useState<number>(1.5);
  const [inputZ, setInputZ] = useState<number>(2.2);

  // Range for plotting functions
  const zMin = -4;
  const zMax = 4;
  const width = 540;
  const height = 300;
  const padding = { top: 20, right: 25, bottom: 40, left: 45 };

  const toSvgX = (z: number) => padding.left + ((z - zMin) / (zMax - zMin)) * (width - padding.left - padding.right);
  const toSvgY = (w: number) => height - padding.bottom - ((w - zMin) / (zMax - zMin)) * (height - padding.top - padding.bottom);

  // Soft thresholding formula: sign(z) * max(0, |z| - lambda)
  const softThreshold = (z: number, l: number) => {
    if (z > l) return z - l;
    if (z < -l) return z + l;
    return 0;
  };

  // Ridge shrinkage formula: z / (1 + lambda)
  const ridgeShrink = (z: number, l: number) => {
    return z / (1 + l);
  };

  // Precompute paths
  const steps = 80;
  const identityPts: string[] = [];
  const ridgePts: string[] = [];
  const lassoPts: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const z = zMin + (i / steps) * (zMax - zMin);
    const wOLS = z;
    const wRidge = ridgeShrink(z, lambda);
    const wLasso = softThreshold(z, lambda);

    const prefix = i === 0 ? 'M' : 'L';
    identityPts.push(`${prefix} ${toSvgX(z).toFixed(1)} ${toSvgY(wOLS).toFixed(1)}`);
    ridgePts.push(`${prefix} ${toSvgX(z).toFixed(1)} ${toSvgY(wRidge).toFixed(1)}`);
    lassoPts.push(`${prefix} ${toSvgX(z).toFixed(1)} ${toSvgY(wLasso).toFixed(1)}`);
  }

  const curOLS = inputZ;
  const curRidge = ridgeShrink(inputZ, lambda);
  const curLasso = softThreshold(inputZ, lambda);

  return (
    <div className="my-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <span className="flex h-3 w-3 rounded-full bg-violet-500"></span>
          Operator Mechanics: Proportional Decay vs Soft-Thresholding
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          In an orthonormal design, Ridge applies a linear scaling factor 1/(1+&lambda;), whereas Lasso applies non-linear soft-thresholding S<sub>&lambda;</sub>(z) = sign(z) max(0, |z| &minus; &lambda;).
        </p>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Penalty Strength (&lambda;)
            </label>
            <span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded">
              &lambda; = {lambda.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={lambda}
            onChange={e => setLambda(parseFloat(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
            <span>&lambda; = 0.2 (Mild)</span>
            <span>&lambda; = 3.0 (Severe)</span>
          </div>
        </div>

        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 border border-zinc-200/70 dark:border-zinc-700/50">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              OLS Estimate (Input z = w*<sub>OLS</sub>)
            </label>
            <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
              z = {inputZ.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="-3.5"
            max="3.5"
            step="0.1"
            value={inputZ}
            onChange={e => setInputZ(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-mono">
            <span>-3.5</span>
            <span>0</span>
            <span>+3.5</span>
          </div>
        </div>
      </div>

      {/* Operator plot */}
      <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-sans">
          {/* Zero axes */}
          <line
            x1={padding.left}
            y1={toSvgY(0)}
            x2={width - padding.right}
            y2={toSvgY(0)}
            stroke="#52525b"
            strokeWidth="1.5"
          />
          <line
            x1={toSvgX(0)}
            y1={padding.top}
            x2={toSvgX(0)}
            y2={height - padding.bottom}
            stroke="#52525b"
            strokeWidth="1.5"
          />

          {/* Lasso Dead Zone shading [-lambda, +lambda] */}
          <rect
            x={toSvgX(-lambda)}
            y={padding.top}
            width={toSvgX(lambda) - toSvgX(-lambda)}
            height={height - padding.top - padding.bottom}
            fill="#10b981"
            fillOpacity="0.08"
          />
          <line
            x1={toSvgX(-lambda)}
            y1={padding.top}
            x2={toSvgX(-lambda)}
            y2={height - padding.bottom}
            stroke="#10b981"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <line
            x1={toSvgX(lambda)}
            y1={padding.top}
            x2={toSvgX(lambda)}
            y2={height - padding.bottom}
            stroke="#10b981"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text
            x={toSvgX(0)}
            y={padding.top + 20}
            fill="#6ee7b7"
            fontSize="10"
            textAnchor="middle"
            fontFamily="monospace"
          >
            Lasso Dead Zone [–&lambda;, +&lambda;] &rarr; Output = 0
          </text>

          {/* OLS Identity Line */}
          <path d={identityPts.join(' ')} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

          {/* Ridge Curve */}
          <path d={ridgePts.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Lasso Curve */}
          <path d={lassoPts.join(' ')} fill="none" stroke="#34d399" strokeWidth="2.5" />

          {/* Input Marker Line */}
          <line
            x1={toSvgX(inputZ)}
            y1={padding.top}
            x2={toSvgX(inputZ)}
            y2={height - padding.bottom}
            stroke="#f59e0b"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Output Markers */}
          <circle cx={toSvgX(inputZ)} cy={toSvgY(curOLS)} r="4" fill="#ef4444" />
          <circle cx={toSvgX(inputZ)} cy={toSvgY(curRidge)} r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx={toSvgX(inputZ)} cy={toSvgY(curLasso)} r="5" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />

          {/* Axis Labels */}
          <text x={width - 20} y={toSvgY(0) + 15} fill="#a1a1aa" fontSize="10" fontFamily="monospace">
            z
          </text>
          <text x={toSvgX(0) + 8} y={padding.top + 10} fill="#a1a1aa" fontSize="10" fontFamily="monospace">
            ŵ
          </text>
        </svg>

        {/* Legend */}
        <div className="absolute top-3 left-4 bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-b border-dashed border-red-500 inline-block"></span>
            <span>OLS: ŵ = z</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400 inline-block"></span>
            <span>Ridge: ŵ = z / (1 + &lambda;)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
            <span>Lasso: ŵ = sign(z) max(0, |z| – &lambda;)</span>
          </div>
        </div>
      </div>

      {/* Output Value Cards */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">OLS Result</div>
          <div className="font-mono text-sm font-bold text-red-500 mt-0.5">{curOLS.toFixed(3)}</div>
        </div>
        <div className="p-2 rounded bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40">
          <div className="text-[10px] text-sky-600 dark:text-sky-400 uppercase tracking-wider font-semibold">Ridge Result</div>
          <div className="font-mono text-sm font-bold text-sky-500 mt-0.5">{curRidge.toFixed(3)}</div>
          <div className="text-[9px] text-zinc-400">Shrunk by {(100 * (1 - curRidge / (curOLS || 1e-5))).toFixed(0)}%</div>
        </div>
        <div className="p-2 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">Lasso Result</div>
          <div className="font-mono text-sm font-bold text-emerald-500 mt-0.5">{curLasso.toFixed(3)}</div>
          <div className="text-[9px] text-zinc-400">
            {curLasso === 0 ? 'Zeroed Out (Sparse)' : `Truncated by ${lambda.toFixed(2)}`}
          </div>
        </div>
      </div>
    </div>
  );
}
