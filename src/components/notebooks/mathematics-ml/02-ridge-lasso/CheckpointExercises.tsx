import React, { useState } from 'react';

/* ─────────────────────────────────────────────
   MCQ DATA (College/Graduate Level)
───────────────────────────────────────────── */
const MCQ = [
  {
    id: 1,
    q: 'In Ridge regression, the closed-form estimator is β̂_ridge = (XᵀX + λI)⁻¹Xᵀy. If the design matrix X has rank deficient columns (multicollinearity), what is guaranteed about XᵀX + λI for any λ > 0?',
    options: [
      'It remains singular and non-invertible',
      'It is guaranteed to be strictly positive definite and therefore always invertible',
      'It is positive semidefinite, requiring pseudo-inverse',
      'It becomes an orthogonal matrix',
    ],
    correct: 1,
    explanation:
      'Since XᵀX is symmetric positive semidefinite (eigenvalues s_j ≥ 0), adding λI shifts every eigenvalue strictly upward: s_j + λ ≥ λ > 0. All eigenvalues are strictly positive, ensuring strict positive definiteness and unique invertibility.',
  },
  {
    id: 2,
    q: 'Geometrically, why does Lasso (L1) produce sparse weight vectors (exact zeros) whereas Ridge (L2) almost never does?',
    options: [
      'Lasso uses a higher learning rate during gradient descent',
      'The L1 constraint region ‖w‖₁ ≤ t has sharp corners (singularities) aligned with coordinate axes where level sets of MSE touch first',
      'L2 norm has discontinuous derivatives at zero that repel weights away from axes',
      'Lasso minimizes absolute error instead of mean squared error',
    ],
    correct: 1,
    explanation:
      'The L1 norm ball {w : ∑|w_j| ≤ t} is a polytope (diamond in 2D, hyperoctahedron in d-D) with sharp vertices along coordinate axes. The expanding elliptical contours of the smooth MSE loss have a high probability of making first contact at one of these non-differentiable vertices where some w_j = 0. In contrast, the L2 ball is a smooth sphere with no corners.',
  },
  {
    id: 3,
    q: 'Under an orthonormal design matrix (XᵀX = I), how does the Ridge regression weight estimate relate to the OLS weight estimate?',
    options: [
      'ŵ_ridge = ŵ_ols − λ',
      'ŵ_ridge = ŵ_ols / (1 + λ)',
      'ŵ_ridge = sign(ŵ_ols) · max(0, |ŵ_ols| − λ)',
      'ŵ_ridge = (1 + λ) · ŵ_ols',
    ],
    correct: 1,
    explanation:
      'When XᵀX = I, (XᵀX + λI)⁻¹Xᵀy = (1 + λ)⁻¹ I Xᵀy = ŵ_ols / (1 + λ). Ridge strictly scales every OLS coefficient down proportionally by the constant shrinkage factor 1 / (1 + λ).',
  },
  {
    id: 4,
    q: 'From a Bayesian perspective, Ridge and Lasso correspond to Maximum A Posteriori (MAP) estimation under which respective prior distributions on the weights w?',
    options: [
      'Ridge: Uniform prior; Lasso: Normal (Gaussian) prior',
      'Ridge: Normal (Gaussian) prior; Lasso: Laplace (Double Exponential) prior',
      'Ridge: Laplace prior; Lasso: Cauchy prior',
      'Ridge: Student-t prior; Lasso: Normal prior',
    ],
    correct: 1,
    explanation:
      'Maximizing the posterior log p(w|y) ∝ log p(y|w) + log p(w). Under a Gaussian likelihood, an independent Gaussian prior p(w_j) ∝ exp(−w_j² / 2σ_w²) contributes a −∑w_j² penalty (Ridge). An independent Laplace prior p(w_j) ∝ exp(−|w_j| / b) contributes a −∑|w_j| penalty (Lasso).',
  },
  {
    id: 5,
    q: 'Why should the bias/intercept term b₀ NEVER be regularized in the Ridge or Lasso penalty terms?',
    options: [
      'Regularizing the intercept prevents matrix inversion algorithms from converging',
      'Penalizing b₀ makes the fitted predictions dependent on arbitrary constant shifts (translations) in the target variable y',
      'The intercept derivative is undefined when regularized',
      'The intercept is always zero in standardized datasets, making regularization redundant',
    ],
    correct: 1,
    explanation:
      'Regularizing the intercept would penalize predicting non-zero mean values. If you add 1,000 to all y values, the true baseline shifts by 1,000; penalizing b₀ would shrink it toward 0, severely biasing predictions solely due to the choice of origin for y.',
  },
];

/* ─────────────────────────────────────────────
   THEORY / DERIVATION EXERCISES
───────────────────────────────────────────── */
const THEORY = [
  {
    id: 1,
    q: 'Derive the closed-form Ridge Regression estimator β̂_ridge = (XᵀX + λI)⁻¹Xᵀy by minimizing the regularized objective function J(β) = ‖y − Xβ‖₂² + λ‖β‖₂².',
    answer: `1. Expand the objective function in matrix notation:
   J(β) = (y − Xβ)ᵀ(y − Xβ) + λ βᵀβ
        = yᵀy − 2 yᵀXβ + βᵀXᵀXβ + λ βᵀβ
        = yᵀy − 2(Xᵀy)ᵀβ + βᵀ(XᵀX + λI)β

2. Compute the matrix gradient with respect to β:
   ∇_β J(β) = −2 Xᵀy + 2(XᵀX + λI)β

3. Set the gradient to zero for optimality:
   −2 Xᵀy + 2(XᵀX + λI)β = 0
   (XᵀX + λI)β = Xᵀy

4. Since (XᵀX + λI) is strictly positive definite for λ > 0, it is invertible:
   β̂_ridge = (XᵀX + λI)⁻¹ Xᵀy.`,
  },
  {
    id: 2,
    q: 'Show why standardizing features (zero mean, unit variance) is strictly mandatory before applying Ridge or Lasso regularization.',
    answer: `The regularisation penalty λ ∑ w_j² (or λ ∑ |w_j|) penalises all weight magnitudes uniformly.

Suppose feature x₁ is measured in meters (values ~ 1 to 10) and feature x₂ is measured in millimeters (values ~ 1,000 to 10,000).
To produce an equivalent physical effect on target y, the true model must satisfy w₂ = w₁ / 1000.

Because w₂ is 1,000 times smaller naturally due solely to units:
• The penalty λ w₁² will be 1,000,000 times larger than λ w₂²!
• The regularizer will aggressively suppress x₁ while leaving x₂ almost unpenalized, simply because of arbitrary unit choice.

Standardizing features to unit variance ensures every feature's weight operates on an equal scale, allowing the penalty λ to treat all features equitably.`,
  },
  {
    id: 3,
    q: 'Derive the soft-thresholding operator S_λ(z) for a 1D Lasso problem: minimize J(w) = ½(w − z)² + λ|w|.',
    answer: `The objective J(w) = ½(w − z)² + λ|w| is non-differentiable at w = 0. We use subgradient calculus:

Subgradient of |w| is:
∂|w| = { +1 if w > 0,   −1 if w < 0,   [−1, +1] if w = 0 }

Case 1: w > 0
∂J/∂w = (w − z) + λ = 0  ⟹  w = z − λ. Valid only if z > λ.

Case 2: w < 0
∂J/∂w = (w − z) − λ = 0  ⟹  w = z + λ. Valid only if z < −λ.

Case 3: w = 0
The condition 0 ∈ ∂J(0) means 0 ∈ −z + λ[−1, +1]  ⟹  z ∈ [−λ, λ], i.e., |z| ≤ λ.

Combining all three cases yields the closed-form Soft-Thresholding operator:
w* = S_λ(z) = sign(z) · max(0, |z| − λ).`,
  },
  {
    id: 4,
    q: 'Explain the bias-variance tradeoff in Ridge regression. How do bias² and variance evolve as λ varies from 0 to ∞?',
    answer: `The Expected Prediction Error decomposes into:
MSE = Bias(β̂)² + Var(β̂) + σ²_noise.

When λ = 0 (OLS):
• Bias is zero (OLS is the Best Linear Unbiased Estimator by Gauss-Markov).
• Variance is high, especially if features are correlated or m ≈ d.

As λ increases (0 < λ < ∞):
• β̂ is pulled toward 0, introducing shrinkage bias: Bias(β̂)² increases monotonically.
• Variance Var(β̂) = σ² (XᵀX + λI)⁻¹ XᵀX (XᵀX + λI)⁻¹ decreases monotonically.

When λ → ∞:
• β̂ → 0, Variance → 0, but Bias² rises to the full target variance.

By allowing a small amount of bias (mild λ), the dramatic reduction in variance often yields a substantial net decrease in total MSE.`,
  },
  {
    id: 5,
    q: 'What is Elastic Net, and why was it introduced to overcome specific limitations of Lasso?',
    answer: `Elastic Net combines L1 and L2 penalties:
J(β) = MSE + λ₁ ‖β‖₁ + λ₂ ‖β‖₂²

It was designed by Zou & Hastie (2005) to overcome three key drawbacks of Lasso:
1. Feature limit in p > n: In high-dimensional data where p > n, Lasso can select at most n features before saturating. Elastic Net can select all p features.
2. Grouping effect: When a group of features are highly correlated with each other, Lasso arbitrarily picks just one and ignores the rest. The L2 quadratic term in Elastic Net forces correlated features to be selected together with similar weights.
3. Extreme collinearity: Severe collinearity causes Lasso prediction performance to degrade compared to Ridge. The L2 term stabilizes the conditioning matrix.`,
  },
];

export default function CheckpointExercises() {
  const [activeTab, setActiveTab] = useState<'mcq' | 'theory'>('mcq');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showTheoryAnswers, setShowTheoryAnswers] = useState<Record<number, boolean>>({});

  const handleSelectOption = (qId: number, optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const toggleTheoryAnswer = (qId: number) => {
    setShowTheoryAnswers(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className="my-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800 gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>📝</span>
            Chapter 2 Checkpoint: Mastery Assessment
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Test your conceptual, geometrical, and mathematical grasp of regularisation, shrinkage, and sparsity.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('mcq')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'mcq'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Multiple Choice ({MCQ.length})
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'theory'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Mathematical Proofs ({THEORY.length})
          </button>
        </div>
      </div>

      {/* MCQ Section */}
      {activeTab === 'mcq' && (
        <div className="mt-6 space-y-6">
          {MCQ.map(item => {
            const chosen = selectedAnswers[item.id];
            const isAnswered = chosen !== undefined;
            const isCorrect = chosen === item.correct;

            return (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30"
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mr-2">Q{item.id}.</span>
                  {item.q}
                </div>

                <div className="space-y-2">
                  {item.options.map((opt, idx) => {
                    let btnStyle =
                      'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300';

                    if (isAnswered) {
                      if (idx === item.correct) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium';
                      } else if (idx === chosen) {
                        btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300';
                      } else {
                        btnStyle = 'border-zinc-200 bg-zinc-100/40 dark:border-zinc-800 dark:bg-zinc-900/40 opacity-50 text-zinc-500';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => handleSelectOption(item.id, idx)}
                        className={`w-full text-left p-2.5 rounded-md border text-xs transition-colors flex items-start gap-2.5 ${btnStyle}`}
                      >
                        <span className="font-mono font-bold text-zinc-400 mt-0.5">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation feedback */}
                {isAnswered && (
                  <div
                    className={`mt-3 p-3 rounded text-xs border ${
                      isCorrect
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40'
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {isCorrect ? '✓ Correct Answer' : '✕ Needs Review'}
                    </div>
                    <div>{item.explanation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Theory & Derivation Section */}
      {activeTab === 'theory' && (
        <div className="mt-6 space-y-6">
          {THEORY.map(item => {
            const isOpen = showTheoryAnswers[item.id];

            return (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30"
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mr-2">P{item.id}.</span>
                  {item.q}
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => toggleTheoryAnswer(item.id)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>{isOpen ? '▲ Hide Step-by-Step Proof' : '▼ Reveal Full Derivation & Solution'}</span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 p-3.5 rounded bg-zinc-900 text-zinc-200 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-zinc-700/60 overflow-x-auto">
                      {item.answer}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
