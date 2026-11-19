import React, { useState, useMemo } from 'react';

interface Applicant {
  income: number; // in thousands ($k/yr)
  approved: number; // 0 = Rejected, 1 = Approved
}

// Representative loan approval dataset based on annual income (in $k)
const LOAN_APPLICANTS: Applicant[] = [
  { income: 15, approved: 0 },
  { income: 22, approved: 0 },
  { income: 28, approved: 0 },
  { income: 35, approved: 0 },
  { income: 40, approved: 0 },
  { income: 45, approved: 0 },
  { income: 48, approved: 1 }, // edge case / slight overlap
  { income: 52, approved: 0 }, // edge case
  { income: 55, approved: 1 },
  { income: 62, approved: 1 },
  { income: 70, approved: 1 },
  { income: 80, approved: 1 },
  { income: 95, approved: 1 },
  { income: 110, approved: 1 },
];

export default function LogisticVsLinearPlot() {
  const [threshold, setThreshold] = useState<number>(0.5);
  const [includeOutlier, setIncludeOutlier] = useState<boolean>(false);
  const [modelView, setModelView] = useState<'both' | 'linear' | 'logistic'>('both');
  const [testIncome, setTestIncome] = useState<number>(50);

  // SVG dimensions
  const width = 640;
  const height = 380;
  const padding = { top: 30, right: 35, bottom: 50, left: 55 };

  const xMin = 0;
  const xMax = 150; // income in $k
  const yMin = -0.3; // extend below 0 to show linear regression overshoot
  const yMax = 1.3;  // extend above 1 to show linear regression overshoot

  const toSvgX = (x: number) =>
    padding.left + ((x - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
  const toSvgY = (y: number) =>
    height - padding.bottom - ((y - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);

  // Dataset with optional extreme high-income applicant
  const dataset = useMemo(() => {
    if (!includeOutlier) return LOAN_APPLICANTS;
    return [
      ...LOAN_APPLICANTS,
      { income: 145, approved: 1 }, // extreme wealthy applicant
      { income: 140, approved: 1 },
    ];
  }, [includeOutlier]);

  // Fit Linear Regression (OLS)
  const linearModel = useMemo(() => {
    const n = dataset.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (const d of dataset) {
      sumX += d.income;
      sumY += d.approved;
      sumXY += d.income * d.approved;
      sumX2 += d.income * d.income;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Decision boundary where y = threshold
    const decisionBoundary = (threshold - intercept) / slope;

    return { slope, intercept, decisionBoundary };
  }, [dataset, threshold]);

  // Fit Logistic Regression using Newton-Raphson / IRLS on normalised income
  const logisticModel = useMemo(() => {
    const n = dataset.length;
    const xRaw = dataset.map((d) => d.income);
    const y = dataset.map((d) => d.approved);

    const xMean = xRaw.reduce((a, b) => a + b, 0) / n;
    const xStd = Math.sqrt(xRaw.reduce((a, b) => a + (b - xMean) ** 2, 0) / n) || 1;
    const xNorm = xRaw.map((v) => (v - xMean) / xStd);

    // Iterative Reweighted Least Squares
    let w = 0.0;
    let b = 0.0;

    for (let iter = 0; iter < 40; iter++) {
      let gradW = 0;
      let gradB = 0;
      let hessWW = 1e-5;
      let hessWB = 0;
      let hessBB = 1e-5;

      for (let i = 0; i < n; i++) {
        const z = w * xNorm[i] + b;
        const p = 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));
        const diff = p - y[i];
        const w_i = Math.max(p * (1 - p), 1e-5);

        gradW += diff * xNorm[i];
        gradB += diff;

        hessWW += w_i * xNorm[i] * xNorm[i];
        hessWB += w_i * xNorm[i];
        hessBB += w_i;
      }

      const det = hessWW * hessBB - hessWB * hessWB;
      if (Math.abs(det) < 1e-9) break;

      const deltaW = (hessBB * gradW - hessWB * gradB) / det;
      const deltaB = (-hessWB * gradW + hessWW * gradB) / det;

      w -= deltaW;
      b -= deltaB;

      if (Math.abs(deltaW) < 1e-6 && Math.abs(deltaB) < 1e-6) break;
    }

    // Convert back to original income scale: z = w_orig * income + b_orig
    const wOrig = w / xStd;
    const bOrig = b - (w * xMean) / xStd;

    // Decision boundary where p = threshold -> z = ln(threshold / (1 - threshold))
    const logitThreshold = Math.log(threshold / (1 - threshold));
    const decisionBoundary = (logitThreshold - bOrig) / wOrig;

    return { w: wOrig, b: bOrig, decisionBoundary };
  }, [dataset, threshold]);

  // Test point predictions
  const testPredLinear = linearModel.slope * testIncome + linearModel.intercept;
  const testLogit = logisticModel.w * testIncome + logisticModel.b;
  const testPredLogistic = 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, testLogit))));

  // Generate curve points
  const stepCount = 120;
  const curvePoints = useMemo(() => {
    const ptsLinear: { x: number; y: number }[] = [];
    const ptsLogistic: { x: number; y: number }[] = [];

    for (let i = 0; i <= stepCount; i++) {
      const inc = xMin + (i / stepCount) * (xMax - xMin);
      const yLin = linearModel.slope * inc + linearModel.intercept;
      const z = logisticModel.w * inc + logisticModel.b;
      const yLog = 1 / (1 + Math.exp(-Math.max(-25, Math.min(25, z))));

      ptsLinear.push({ x: inc, y: yLin });
      ptsLogistic.push({ x: inc, y: yLog });
    }
    return { ptsLinear, ptsLogistic };
  }, [linearModel, logisticModel]);

  const linearPathD = curvePoints.ptsLinear
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(1)} ${toSvgY(pt.y).toFixed(1)}`)
    .join(' ');

  const logisticPathD = curvePoints.ptsLogistic
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt.x).toFixed(1)} ${toSvgY(pt.y).toFixed(1)}`)
    .join(' ');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs my-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Interactive Loan Approval: Linear vs Logistic Regression
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare probability calibration, decision boundaries, and outlier sensitivity.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {(['both', 'logistic', 'linear'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModelView(m)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all capitalize ${
                modelView === m
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto py-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl mx-auto block">
          <defs>
            <linearGradient id="probGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Valid Probability Region [0, 1] */}
          <rect
            x={padding.left}
            y={toSvgY(1)}
            width={width - padding.left - padding.right}
            height={toSvgY(0) - toSvgY(1)}
            fill="#f8fafc"
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Overshoot Danger Zones */}
          <rect
            x={padding.left}
            y={padding.top}
            width={width - padding.left - padding.right}
            height={toSvgY(1) - padding.top}
            fill="#fef2f2"
            opacity="0.6"
          />
          <text
            x={width - padding.right - 10}
            y={toSvgY(1.15)}
            textAnchor="end"
            fontSize="10"
            fill="#ef4444"
            fontFamily="monospace"
          >
            Invalid Probability (&gt; 1.0)
          </text>

          <rect
            x={padding.left}
            y={toSvgY(0)}
            width={width - padding.left - padding.right}
            height={height - padding.bottom - toSvgY(0)}
            fill="#fef2f2"
            opacity="0.6"
          />
          <text
            x={width - padding.right - 10}
            y={toSvgY(-0.15)}
            textAnchor="end"
            fontSize="10"
            fill="#ef4444"
            fontFamily="monospace"
          >
            Invalid Probability (&lt; 0.0)
          </text>

          {/* Horizontal Reference Lines (0, 0.5, 1.0) */}
          {[0, 0.5, 1].map((lvl) => (
            <g key={lvl}>
              <line
                x1={padding.left}
                y1={toSvgY(lvl)}
                x2={width - padding.right}
                y2={toSvgY(lvl)}
                stroke={lvl === 0.5 ? '#94a3b8' : '#cbd5e1'}
                strokeDasharray={lvl === 0.5 ? '4,4' : undefined}
                strokeWidth={lvl === 0.5 ? 1.5 : 1}
              />
              <text
                x={padding.left - 8}
                y={toSvgY(lvl) + 4}
                textAnchor="end"
                fontSize="11"
                fontFamily="monospace"
                fill={lvl === 0.5 ? '#475569' : '#64748b'}
              >
                {lvl.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Classification Threshold line */}
          <line
            x1={padding.left}
            y1={toSvgY(threshold)}
            x2={width - padding.right}
            y2={toSvgY(threshold)}
            stroke="#8b5cf6"
            strokeDasharray="3,3"
            strokeWidth="1.5"
          />
          <text
            x={padding.left + 8}
            y={toSvgY(threshold) - 5}
            fontSize="10"
            fill="#7c3aed"
            fontWeight="bold"
            fontFamily="monospace"
          >
            Threshold = {threshold.toFixed(2)}
          </text>

          {/* Linear Decision Boundary */}
          {(modelView === 'both' || modelView === 'linear') &&
            linearModel.decisionBoundary >= xMin &&
            linearModel.decisionBoundary <= xMax && (
              <g>
                <line
                  x1={toSvgX(linearModel.decisionBoundary)}
                  y1={padding.top}
                  x2={toSvgX(linearModel.decisionBoundary)}
                  y2={height - padding.bottom}
                  stroke="#f97316"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
                <text
                  x={toSvgX(linearModel.decisionBoundary)}
                  y={height - padding.bottom + 26}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#c2410c"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Lin: ${linearModel.decisionBoundary.toFixed(0)}k
                </text>
              </g>
            )}

          {/* Logistic Decision Boundary */}
          {(modelView === 'both' || modelView === 'logistic') &&
            logisticModel.decisionBoundary >= xMin &&
            logisticModel.decisionBoundary <= xMax && (
              <g>
                <line
                  x1={toSvgX(logisticModel.decisionBoundary)}
                  y1={padding.top}
                  x2={toSvgX(logisticModel.decisionBoundary)}
                  y2={height - padding.bottom}
                  stroke="#2563eb"
                  strokeDasharray="4,4"
                  strokeWidth="1.5"
                />
                <text
                  x={toSvgX(logisticModel.decisionBoundary)}
                  y={height - padding.bottom + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#1d4ed8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Log: ${logisticModel.decisionBoundary.toFixed(0)}k
                </text>
              </g>
            )}

          {/* Curves */}
          {(modelView === 'both' || modelView === 'linear') && (
            <path d={linearPathD} fill="none" stroke="#f97316" strokeWidth="2.5" />
          )}

          {(modelView === 'both' || modelView === 'logistic') && (
            <path d={logisticPathD} fill="none" stroke="#2563eb" strokeWidth="3" />
          )}

          {/* Data Points */}
          {dataset.map((pt, idx) => {
            const isApproved = pt.approved === 1;
            const cx = toSvgX(pt.income);
            const cy = toSvgY(pt.approved);
            return (
              <g key={idx}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="5.5"
                  fill={isApproved ? '#10b981' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all hover:scale-125"
                />
              </g>
            );
          })}

          {/* Interactive Test Applicant Point */}
          <g>
            <line
              x1={toSvgX(testIncome)}
              y1={padding.top}
              x2={toSvgX(testIncome)}
              y2={height - padding.bottom}
              stroke="#0f172a"
              strokeDasharray="2,2"
              strokeWidth="1"
            />
            {/* Logistic prediction dot */}
            {(modelView === 'both' || modelView === 'logistic') && (
              <circle
                cx={toSvgX(testIncome)}
                cy={toSvgY(Math.max(yMin, Math.min(yMax, testPredLogistic)))}
                r="6.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
            {/* Linear prediction dot */}
            {(modelView === 'both' || modelView === 'linear') && (
              <circle
                cx={toSvgX(testIncome)}
                cy={toSvgY(Math.max(yMin, Math.min(yMax, testPredLinear)))}
                r="6.5"
                fill="#f97316"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
          </g>

          {/* X-axis labels */}
          {[0, 30, 60, 90, 120, 150].map((val) => (
            <text
              key={val}
              x={toSvgX(val)}
              y={height - padding.bottom + 16}
              textAnchor="middle"
              fontSize="11"
              fontFamily="monospace"
              fill="#64748b"
            >
              ${val}k
            </text>
          ))}

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 6}
            textAnchor="middle"
            fontSize="12"
            fill="#334155"
            fontWeight="600"
          >
            Annual Income ($k)
          </text>
          <text
            x={-height / 2}
            y="18"
            textAnchor="middle"
            fontSize="12"
            fill="#334155"
            fontWeight="600"
            transform="rotate(-90)"
          >
            Probability P(Loan = Approved | Income)
          </text>
        </svg>
      </div>

      {/* Legend & Controls Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-600 font-semibold">Test Income ($k/year):</span>
              <span className="text-blue-600 font-bold">${testIncome}k</span>
            </div>
            <input
              type="range"
              min="10"
              max="140"
              step="1"
              value={testIncome}
              onChange={(e) => setTestIncome(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-600 font-semibold">Decision Cutoff (Threshold):</span>
              <span className="text-purple-600 font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeOutlier}
              onChange={(e) => setIncludeOutlier(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Add high-income outlier applicants ($140k, $145k)</span>
          </label>
        </div>

        {/* Live Evaluation Box */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs font-mono space-y-2">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
            Prediction for ${testIncome}k Applicant
          </div>

          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              Logistic Sigmoid:
            </span>
            <span className="font-bold text-slate-900">
              P = {(testPredLogistic * 100).toFixed(1)}% →{' '}
              <span
                className={
                  testPredLogistic >= threshold ? 'text-green-600' : 'text-red-600'
                }
              >
                {testPredLogistic >= threshold ? 'APPROVED' : 'REJECTED'}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <span className="flex items-center gap-1.5 text-orange-700 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              Linear OLS:
            </span>
            <span className="font-bold text-slate-900">
              ŷ = {testPredLinear.toFixed(2)}{' '}
              {testPredLinear < 0 || testPredLinear > 1 ? (
                <span className="text-red-500 font-semibold text-[10px]">(Out of Bounds!)</span>
              ) : null}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 pt-1 font-sans leading-relaxed">
            <span className="font-semibold text-slate-800">Notice:</span> Notice how the linear
            model produces probabilities below 0 or above 1. When high-income outliers are added,
            the linear boundary shifts significantly rightward, misclassifying middle-income applicants,
            whereas the logistic curve saturates naturally and remains robust.
          </div>
        </div>
      </div>
    </div>
  );
}
