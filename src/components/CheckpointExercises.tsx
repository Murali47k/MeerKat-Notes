import React, { useState } from 'react';

/* ─────────────────────────────────────────────
   MCQ DATA  (5 questions, college-level)
───────────────────────────────────────────── */
const MCQ = [
  {
    id: 1,
    q: 'Which of the following conditions guarantees a unique OLS solution for β in the normal equations (XᵀX)β = Xᵀy?',
    options: [
      'The design matrix X has more rows than columns',
      'XᵀX is invertible (full column rank of X)',
      'The residuals are normally distributed',
      'The learning rate α is sufficiently small',
    ],
    correct: 1,
    explanation: 'OLS has a unique closed-form solution β = (XᵀX)⁻¹Xᵀy exactly when XᵀX is invertible, which requires X to have full column rank (no perfectly collinear predictors).',
  },
  {
    id: 2,
    q: 'The MSE cost function J(b₀, b₁) for simple linear regression is a paraboloid. This means gradient descent will:',
    options: [
      'Converge to a local minimum that may differ from the global minimum',
      'Diverge unless the learning rate is exactly 1',
      'Always converge to the unique global minimum for any positive learning rate',
      'Always converge to the global minimum for a sufficiently small positive learning rate',
    ],
    correct: 3,
    explanation: 'The MSE surface is strictly convex (a paraboloid), so it has exactly one global minimum and no local minima. Gradient descent converges to it for any sufficiently small positive learning rate.',
  },
  {
    id: 3,
    q: 'If you multiply all input features x by a constant c > 0 (keeping y unchanged), what happens to the OLS slope estimate b₁*?',
    options: [
      'b₁* is multiplied by c',
      'b₁* is divided by c',
      'b₁* is unchanged',
      'b₁* is multiplied by c²',
    ],
    correct: 1,
    explanation: 'b₁* = Cov(x,y)/Var(x). Scaling x by c scales Cov(cx,y) = c·Cov(x,y) and Var(cx) = c²·Var(x), so b₁* → c·Cov(x,y) / c²·Var(x) = b₁*/c. The slope is divided by c.',
  },
  {
    id: 4,
    q: 'In gradient descent for linear regression, adding an L2 regularisation term λ‖w‖² to the cost function is called Ridge Regression. Its effect on the weight update is:',
    options: [
      'w := w − α(∇J + λw), causing weights to shrink toward zero each step',
      'w := w − α∇J + λw, causing weights to grow each step',
      'w := w − α∇J, unchanged — regularisation only affects the loss value',
      'w := w/(1 + αλ) with no gradient term',
    ],
    correct: 0,
    explanation: 'The gradient of ½λ‖w‖² is λw, so the update becomes w := w − α(∇J_mse + λw) = (1 − αλ)w − α∇J_mse. The factor (1 − αλ) < 1 "decays" weights toward zero each step — hence the name weight decay.',
  },
  {
    id: 5,
    q: 'The coefficient of determination R² is defined as 1 − SS_res/SS_tot. A model with R² = 0 means:',
    options: [
      'The model perfectly predicts all training targets',
      'The model is no better than always predicting the mean ȳ',
      'The model has negative predictive power',
      'The residuals are zero',
    ],
    correct: 1,
    explanation: 'SS_res = SS_tot ⟹ 1 − SS_res/SS_tot = 0. This happens exactly when the fitted values equal the constant mean prediction ŷ = ȳ for every point, i.e. the predictor carries zero information over the baseline mean model.',
  },
];

/* ─────────────────────────────────────────────
   THEORY DATA  (5 questions)
───────────────────────────────────────────── */
const THEORY = [
  {
    id: 1,
    q: 'Derive the OLS estimate b₁* from scratch by minimising J(b₀, b₁) = (1/2m) Σ(b₀ + b₁xⁱ − yⁱ)². Show all partial derivative steps.',
    answer: `Set ∂J/∂b₀ = 0 and ∂J/∂b₁ = 0.

∂J/∂b₀ = (1/m) Σ(b₀ + b₁xⁱ − yⁱ) = 0
  ⟹  b₀ = ȳ − b₁x̄          … (i)

∂J/∂b₁ = (1/m) Σ(b₀ + b₁xⁱ − yⁱ)·xⁱ = 0
  ⟹  Σ(b₀xⁱ + b₁(xⁱ)² − yⁱxⁱ) = 0

Substitute (i): b₀ = ȳ − b₁x̄

  Σ((ȳ − b₁x̄)xⁱ + b₁(xⁱ)² − yⁱxⁱ) = 0
  Σ(ȳxⁱ − b₁x̄xⁱ + b₁(xⁱ)² − yⁱxⁱ) = 0
  Σ(yⁱ − ȳ)(xⁱ − x̄) = b₁ · Σ(xⁱ − x̄)²

Therefore:  b₁* = Σ(xⁱ − x̄)(yⁱ − ȳ) / Σ(xⁱ − x̄)²
                 = Cov(x, y) / Var(x)`,
  },
  {
    id: 2,
    q: 'Why does the factor 1/(2m) instead of 1/m in the MSE cost function not change the optimal parameters? Show mathematically.',
    answer: `Let J(θ) = (1/2m) Σ(ŷⁱ − yⁱ)² and J̃(θ) = (1/m) Σ(ŷⁱ − yⁱ)².

Note J̃(θ) = 2 · J(θ), i.e. J̃ = c · J for constant c = 2 > 0.

Minimising a function and minimising a positive scalar multiple of it yield the same argmin:

  θ* = argmin J(θ) = argmin c·J(θ) = argmin J̃(θ)

Proof: θ* minimises J ⟺ ∇J(θ*) = 0 ⟺ c·∇J(θ*) = 0 ⟺ ∇(cJ)(θ*) = 0.

The 1/2 factor is chosen purely for algebraic convenience: when you differentiate (ŷ − y)², the power rule yields 2(ŷ − y), and the 1/2 cancels that 2, giving a cleaner gradient (1/m)Σ(ŷⁱ − yⁱ)·xⁱ.`,
  },
  {
    id: 3,
    q: 'Show that the OLS residuals ê = y − Xb* are orthogonal to the column space of X, i.e. Xᵀê = 0.',
    answer: `From the normal equations:  (XᵀX)b* = Xᵀy

Multiply out the residual definition ê = y − Xb*:

  Xᵀê = Xᵀ(y − Xb*)
       = Xᵀy − XᵀXb*
       = Xᵀy − Xᵀy      (substituting normal equations: XᵀXb* = Xᵀy)
       = 0               ✓

Geometric interpretation: The fitted values Xb* are the orthogonal projection of y onto col(X). The residual ê = y − Xb* is therefore perpendicular to every column of X, confirming Xᵀê = 0.`,
  },
  {
    id: 4,
    q: 'Prove that the total sum of squares decomposes as SS_tot = SS_reg + SS_res, and hence R² ∈ [0, 1] for OLS.',
    answer: `Define:
  SS_tot = Σ(yⁱ − ȳ)²
  SS_res = Σ(yⁱ − ŷⁱ)²   (residuals ê)
  SS_reg = Σ(ŷⁱ − ȳ)²

Write yⁱ − ȳ = (ŷⁱ − ȳ) + (yⁱ − ŷⁱ):

  SS_tot = Σ[(ŷⁱ − ȳ) + êⁱ]²
         = Σ(ŷⁱ − ȳ)² + 2Σ(ŷⁱ − ȳ)êⁱ + Σ(êⁱ)²

Cross-term = 2Σ(ŷⁱ − ȳ)êⁱ.
Since ŷ = Xb*, write ŷⁱ − ȳ as a linear combination of columns of X.
By orthogonality Xᵀê = 0, every such linear combination dotted with ê is 0.
Hence the cross-term = 0, giving:

  SS_tot = SS_reg + SS_res   ✓

Therefore R² = 1 − SS_res/SS_tot = SS_reg/SS_tot ≥ 0 (both terms non-negative) and ≤ 1 (SS_res ≤ SS_tot).`,
  },
  {
    id: 5,
    q: 'Gradient descent updates b₁ := b₁ − α · ∂J/∂b₁. Derive the closed-form expression for ∂J/∂b₁ and explain the effect of learning rate α being too large.',
    answer: `J(b₀, b₁) = (1/2m) Σ(b₀ + b₁xⁱ − yⁱ)²

∂J/∂b₁ = (1/2m) · Σ 2(b₀ + b₁xⁱ − yⁱ) · xⁱ
        = (1/m) Σ (ŷⁱ − yⁱ) · xⁱ

This is the mean of the product of residuals and input features — it points in the direction of steepest ascent in parameter space.

Effect of large α:
If α is too large, the step size overshoots the minimum. Each update jumps past the optimal b₁*, landing on the opposite slope of the paraboloid at an even larger error. Successive steps oscillate with growing magnitude — a phenomenon called divergence. Formally, convergence requires α < 2/λ_max where λ_max is the largest eigenvalue of (1/m)XᵀX (the Lipschitz constant of the gradient).`,
  },
];

/* ─────────────────────────────────────────────
   MCQ CARD COMPONENT
───────────────────────────────────────────── */
function MCQCard({ item, index }: { item: typeof MCQ[0]; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-sm font-semibold text-slate-900 leading-snug mb-4">
        <span className="font-mono text-blue-600 mr-2">Q{index + 1}.</span>
        {item.q}
      </p>

      <div className="space-y-2">
        {item.options.map((opt, i) => {
          let style = 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
          if (answered) {
            if (i === item.correct) style = 'border-green-500 bg-green-50 text-green-900 font-semibold';
            else if (i === selected) style = 'border-red-400 bg-red-50 text-red-800';
            else style = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
          }

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${style}`}
            >
              <span className="font-mono text-xs shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center">
                {answered && i === item.correct ? '✓' : answered && i === selected ? '✗' : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`mt-4 p-3.5 rounded-lg text-xs leading-relaxed ${selected === item.correct ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'}`}>
          <span className="font-bold mr-1">{selected === item.correct ? 'Correct!' : 'Incorrect.'}</span>
          {item.explanation}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   THEORY CARD COMPONENT
───────────────────────────────────────────── */
function TheoryCard({ item, index }: { item: typeof THEORY[0]; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <p className="text-sm font-semibold text-slate-900 leading-snug">
        <span className="font-mono text-blue-600 mr-2">T{index + 1}.</span>
        {item.q}
      </p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-xs font-mono font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        {open ? 'Hide Answer ▲' : 'Show Answer ▼'}
      </button>

      {open && (
        <pre className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
          {item.answer}
        </pre>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function CheckpointExercises() {
  const [mcqScore, setMcqScore] = useState<{ correct: number; total: number } | null>(null);

  return (
    <div className="my-8 font-sans">
      {/* ── MCQ Section ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">Part A — Multiple Choice</h4>
        </div>
        <div className="space-y-4">
          {MCQ.map((item, i) => (
            <MCQCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* ── Theory Section ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">Part B — Derivation & Theory</h4>
        </div>
        <div className="space-y-4">
          {THEORY.map((item, i) => (
            <TheoryCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
