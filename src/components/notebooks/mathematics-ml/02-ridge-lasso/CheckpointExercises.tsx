import React, { useState } from 'react';

/* ─────────────────────────────────────────────
   MCQ DATA  (5 questions, aligned with covered topics)
───────────────────────────────────────────── */
const MCQ = [
  {
    id: 1,
    q: 'In Ridge regression, the closed-form estimator is β̂_ridge = (XᵀX + λI)⁻¹Xᵀy. If the design matrix X has multicollinear columns, what is mathematically guaranteed about (XᵀX + λI) for any λ > 0?',
    options: [
      'It remains singular and non-invertible',
      'It is strictly positive definite and therefore always uniquely invertible',
      'It is positive semidefinite and requires a pseudo-inverse',
      'It becomes an orthogonal matrix',
    ],
    correct: 1,
    explanation:
      'Because XᵀX is symmetric positive semidefinite with eigenvalues s_j ≥ 0, adding λI shifts every eigenvalue strictly upward: s_j + λ ≥ λ > 0. Since all eigenvalues are strictly positive, the matrix is guaranteed to be strictly positive definite and invertible.',
  },
  {
    id: 2,
    q: 'What is the primary practical difference between the weights obtained from Lasso (L1) and Ridge (L2) regression?',
    options: [
      'Ridge sets unimportant feature weights to exactly 0, whereas Lasso never sets weights to 0',
      'Lasso drives non-essential feature weights to exactly 0 (sparsity), performing automatic feature selection, while Ridge shrinks weights close to 0 but rarely exact 0',
      'Lasso can only be used with binary classification, while Ridge is for regression',
      'Ridge requires iterative gradient descent, while Lasso always has an exact closed-form matrix solution',
    ],
    correct: 1,
    explanation:
      'Lasso (L1) penalty has a sharp vertex at zero that drives less informative weights to exactly zero, creating a sparse model that effectively performs automated feature selection. Ridge (L2) smoothly shrinks weights towards zero without setting them strictly to zero.',
  },
  {
    id: 3,
    q: 'Why must you ALWAYS standardise features (zero mean, unit variance) before applying Ridge or Lasso regularisation?',
    options: [
      'Because the regularisation penalty treats all weights equally; without standardisation, features with larger physical scales will be unfairly penalised less',
      'Standardisation is required solely to make the target variable normally distributed',
      'Without standardisation, the gradient descent algorithm will always diverge to infinity',
      'Standardisation ensures the Gram matrix XᵀX becomes the identity matrix',
    ],
    correct: 0,
    explanation:
      'The penalty λ∑w_j² (or λ∑|w_j|) penalises all coefficients uniformly. A feature measured in small units (e.g. millimeters) will naturally have small coefficients and escape penalisation, while a feature in large units (e.g. kilometers) will have huge coefficients and be overly crushed. Standardisation brings all features to an equitable playing field.',
  },
  {
    id: 4,
    q: 'Why should the intercept/bias term b₀ NEVER be included in the Ridge or Lasso regularisation penalty?',
    options: [
      'Penalising b₀ makes model predictions sensitive to arbitrary constant offsets (translations) in the target variable y',
      'The intercept derivative is undefined at zero',
      'Regularising b₀ makes the matrix inversion algorithm computationally intractable',
      'The intercept is always zero in every regression dataset by definition',
    ],
    correct: 0,
    explanation:
      'The intercept b₀ captures the overall baseline level (mean) of target y. If we penalise b₀, shifting all y values by a constant (e.g. adding 1,000) would cause the regulariser to artificially drag predictions towards 0, biasing the baseline purely because of the chosen origin for y.',
  },
  {
    id: 5,
    q: 'As the regularisation parameter λ increases from 0 towards infinity in Ridge regression, how do the bias and variance of the model evolve?',
    options: [
      'Bias decreases and variance decreases',
      'Bias increases and variance increases',
      'Bias increases and variance decreases',
      'Bias decreases and variance increases',
    ],
    correct: 2,
    explanation:
      'At λ = 0 (OLS), bias is lowest (unbiased by Gauss-Markov) but variance can be high. As λ increases, the parameters are heavily restricted and shrunk toward 0, introducing bias (higher approximation error) but dramatically reducing parameter variance (sensitivity to sample noise).',
  },
];

/* ─────────────────────────────────────────────
   THEORY DATA (5 questions)
───────────────────────────────────────────── */
const THEORY = [
  {
    id: 1,
    q: 'Derive the closed-form Ridge Regression estimator β̂_ridge = (XᵀX + λI)⁻¹Xᵀy by differentiating the objective function J(β) = (1/2m) ‖y − Xβ‖₂² + (λ/2) ‖β‖₂².',
    answer: `1. Expand the objective function in matrix notation:
   J(β) = (1/2m) (y − Xβ)ᵀ(y − Xβ) + (λ/2) βᵀβ
        = (1/2m) [ yᵀy − 2 yᵀXβ + βᵀXᵀXβ ] + (λ/2) βᵀβ

2. Compute the matrix gradient with respect to β:
   ∇_β J(β) = (1/m) [ −Xᵀy + XᵀXβ ] + λ β

3. Set the gradient to zero for optimality:
   (1/m) ( −Xᵀy + XᵀXβ ) + λ β = 0
   −Xᵀy + XᵀXβ + mλ β = 0
   (XᵀX + mλ I) β = Xᵀy

4. Letting λ̃ = mλ (reparametrised penalty):
   (XᵀX + λ̃ I) β = Xᵀy

5. Since (XᵀX + λ̃ I) is strictly positive definite for λ̃ > 0, it is unconditionally invertible:
   β̂_ridge = (XᵀX + λ̃ I)⁻¹ Xᵀy.`,
  },
  {
    id: 2,
    q: 'Prove that the eigenvalues of (XᵀX + λI) are strictly positive for any λ > 0, guaranteeing that the Ridge regression system is always invertible.',
    answer: `Let S = XᵀX be the Gram matrix of size d × d.
Since S is symmetric and positive semidefinite:
• All eigenvalues s_1, s_2, …, s_d are real and non-negative: s_j ≥ 0 for all j = 1, …, d.

Let v_j be an eigenvector of S with eigenvalue s_j, so S v_j = s_j v_j.
Now consider the matrix (S + λI):
  (S + λI) v_j = S v_j + λ I v_j
               = s_j v_j + λ v_j
               = (s_j + λ) v_j

Thus, the eigenvalues of (S + λI) are exactly (s_j + λ).
Since s_j ≥ 0 and λ > 0:
  s_j + λ ≥ λ > 0   for all j = 1, …, d.

Every eigenvalue of (XᵀX + λI) is strictly positive.
Since the determinant is the product of eigenvalues:
  det(XᵀX + λI) = ∏(s_j + λ) > 0.
Therefore, the matrix is strictly non-singular and always uniquely invertible.`,
  },
  {
    id: 3,
    q: 'Explain the bias-variance decomposition of Mean Squared Error: E[(y − f̂(x))²] = Bias(f̂)² + Var(f̂) + σ². Why can regularisation lower the total MSE even though it introduces bias?',
    answer: `Let the true data generating process be y = f(x) + ε with E[ε] = 0 and Var(ε) = σ².
For a model estimate f̂(x) trained on a dataset D:
  E[(y − f̂(x))²] = (E[f̂(x)] − f(x))² + E[(f̂(x) − E[f̂(x)])²] + σ²
                 = Bias(f̂)² + Var(f̂) + σ²

• Bias² measures how far the average model prediction is from the true function (underfitting).
• Var measures how sensitive the model prediction is across different training sample draws (overfitting).
• σ² is irreducible environmental noise.

Why Regularisation Works:
OLS is unbiased (Bias = 0), but its variance Var(f̂_OLS) = σ² Tr((XᵀX)⁻¹) can be massive when columns are collinear or m is small.
By introducing a regularisation penalty λ, we accept a tiny amount of bias (Bias² increases slightly from 0), but the variance drops dramatically:
  ΔVar ≫ ΔBias²
Hence, the total MSE = Bias² + Var + σ² achieves a substantially lower minimum at an optimal λ* > 0 than at λ = 0.`,
  },
  {
    id: 4,
    q: 'Show why standardising each feature to zero mean and unit variance is mathematically necessary before applying Ridge or Lasso regularisation.',
    answer: `Suppose we have two features predicting housing prices:
• x₁: size of house in square meters (values ~ 50 to 500)
• x₂: number of bedrooms (values ~ 1 to 5)

If x₁ is instead converted to square centimeters, its numeric values become 10,000× larger (500,000 to 5,000,000).
To maintain the same prediction ŷ, its corresponding weight w₁ must become 10,000× smaller: w₁' = w₁ / 10000.

Penalty effect:
• In unregularised OLS, predictions are identical regardless of unit choice.
• In Ridge, the penalty adds λ(w₁² + w₂²). If w₁ is artificially small due to large unit scale, w₁² is 100,000,000× smaller!
• As a result, the regulariser heavily shrinks w₂ while ignoring w₁, purely as an artifact of measurement units.

By standardising x_j ← (x_j − μ_j) / σ_j:
Each feature has variance 1. The coefficients w_j reflect relative importance per standard deviation change, allowing λ to penalise all features equitably.`,
  },
  {
    id: 5,
    q: 'What is Elastic Net, and what two major practical shortcomings of Lasso does it overcome?',
    answer: `Elastic Net augments the MSE loss with a convex combination of L1 and L2 penalties:
  J(w) = MSE + λ₁ ‖w‖₁ + (λ₂/2) ‖w‖₂²

Shortcomings of Lasso it solves:
1. High-dimensional limit (d > m):
   In genomics or text data where number of features d exceeds samples m, Lasso can select at most m features before it saturates. Elastic Net has no such limitation and can select all d features if informative.

2. Grouping effect under collinearity:
   When a group of features are strongly correlated with each other, Lasso arbitrarily picks just one of them and zeros out the rest. The quadratic L2 penalty in Elastic Net encourages correlated features to share weights and be selected together (grouping effect).`,
  },
];

/* ─────────────────────────────────────────────
   MCQ CARD COMPONENT (Matching Chapter 1 Style)
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
          let style =
            'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
          if (answered) {
            if (i === item.correct)
              style = 'border-green-500 bg-green-50 text-green-900 font-semibold';
            else if (i === selected)
              style = 'border-red-400 bg-red-50 text-red-800';
            else
              style = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
          }

          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${style}`}
            >
              <span className="font-mono text-xs shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center">
                {answered && i === item.correct
                  ? '✓'
                  : answered && i === selected
                  ? '✗'
                  : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={`mt-4 p-3.5 rounded-lg text-xs leading-relaxed ${
            selected === item.correct
              ? 'bg-green-50 border border-green-200 text-green-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <span className="font-bold mr-1">
            {selected === item.correct ? 'Correct!' : 'Incorrect.'}
          </span>
          {item.explanation}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   THEORY CARD COMPONENT (Matching Chapter 1 Style)
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
        className="mt-4 text-xs font-mono font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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
  return (
    <div className="my-8 font-sans">
      {/* ── MCQ Section ── */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
            Part A — Multiple Choice
          </h4>
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
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
            Part B — Derivation & Theory
          </h4>
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
