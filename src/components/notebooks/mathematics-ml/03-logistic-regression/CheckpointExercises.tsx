import React, { useState } from 'react';

/* ─────────────────────────────────────────────
   MCQ DATA  (5 questions, aligned with covered topics)
───────────────────────────────────────────── */
const MCQ = [
  {
    id: 1,
    q: 'Why does Ordinary Least Squares (Linear Regression) fail when directly applied to binary classification (e.g., loan approval where y ∈ {0, 1})?',
    options: [
      'The normal equations (XᵀX)⁻¹Xᵀy cannot be solved with binary numbers',
      'Predictions ŷ = wᵀx + b are unbounded and can output values < 0 or > 1, and distant correct points heavily distort the decision boundary',
      'Linear regression cannot compute gradients when features are positive',
      'Linear regression only works when the dataset has more than 10,000 observations',
    ],
    correct: 1,
    explanation:
      'Linear regression outputs continuous unconstrained real values (-∞ to +∞), violating the fundamental probability axiom 0 ≤ P(y=1|x) ≤ 1. Furthermore, squaring residuals means extreme correct data points (e.g. an ultra-wealthy applicant who is clearly approved) pull the line towards themselves, shifting and corrupting the decision boundary.',
  },
  {
    id: 2,
    q: 'What is the logit (log-odds) function in logistic regression, and what range does it map?',
    options: [
      'It maps the probability p ∈ (0, 1) to the entire real line (-∞, +∞) via ln(p / (1 - p))',
      'It maps raw features x to discrete binary outputs {0, 1}',
      'It maps the weights w to non-negative values [0, ∞)',
      'It computes the derivative of the squared error loss function',
    ],
    correct: 0,
    explanation:
      'The odds are defined as p / (1 - p), representing the ratio of success to failure. Taking the natural logarithm gives the logit: ln(p / (1 - p)) = wᵀx + b. The logit maps probabilities p ∈ (0, 1) monotonically onto (-∞, +∞), allowing a linear model to represent unbounded log-odds while its inverse (the sigmoid) guarantees valid probabilities.',
  },
  {
    id: 3,
    q: 'Why can we NOT use Mean Squared Error (MSE) with the logistic sigmoid hypothesis h_θ(x) = σ(wᵀx + b)?',
    options: [
      'MSE cannot be differentiated when σ(z) is present',
      'MSE produces a non-convex loss surface with multiple suboptimal local minima, preventing standard gradient descent from guaranteeing a global optimum',
      'MSE always evaluates to zero for all inputs',
      'MSE requires matrix inversion which is impossible for classification',
    ],
    correct: 1,
    explanation:
      'Composing the non-linear, saturating sigmoid function σ(z) with a quadratic squared-error penalty results in a non-convex error surface riddled with local minima and flat plateaus where gradients vanish. Binary cross-entropy (negative log-likelihood) is strictly convex in parameters, ensuring gradient descent converges to the global minimum.',
  },
  {
    id: 4,
    q: 'What is the exact derivative of the standard logistic sigmoid function σ(z) = 1 / (1 + e⁻ᶻ) with respect to z?',
    options: [
      'dσ/dz = σ(z)²',
      'dσ/dz = 1 - σ(z)',
      'dσ/dz = σ(z)(1 - σ(z))',
      'dσ/dz = e⁻ᶻ / (1 + e⁻ᶻ)',
    ],
    correct: 2,
    explanation:
      'Differentiating σ(z) = (1 + e⁻ᶻ)⁻¹ yields -1(1 + e⁻ᶻ)⁻²(-e⁻ᶻ) = (e⁻ᶻ) / (1 + e⁻ᶻ)² = [1 / (1 + e⁻ᶻ)] · [e⁻ᶻ / (1 + e⁻ᶻ)] = σ(z)(1 - σ(z)). This property makes gradient computations exceptionally fast.',
  },
  {
    id: 5,
    q: 'For an applicant with annual income x, suppose a trained loan approval model gives w₁ = 0.08 and b = -4.0. At what income threshold is the applicant predicted to have exactly a 50% probability of loan approval?',
    options: [
      '$50,000 (x = 50)',
      '$40,000 (x = 40)',
      '$25,000 (x = 25)',
      '$80,000 (x = 80)',
    ],
    correct: 0,
    explanation:
      'A predicted probability of p = 0.5 occurs when the logit z = 0, because σ(0) = 1 / (1 + e⁰) = 0.5. Setting w₁x + b = 0 gives 0.08x - 4.0 = 0 → x = 4.0 / 0.08 = 50 ($50,000).',
  },
];

/* ─────────────────────────────────────────────
   THEORY DATA (5 questions)
───────────────────────────────────────────── */
const THEORY = [
  {
    id: 1,
    q: 'Derive the inverse of the logit link function to prove that p = σ(z) = 1 / (1 + e⁻ᶻ).',
    answer: `1. Define log-odds (logit):
   z = ln( p / (1 − p) )

2. Exponentiate both sides:
   eᶻ = p / (1 − p)

3. Multiply through by (1 − p):
   eᶻ (1 − p) = p
   eᶻ − p · eᶻ = p

4. Group all terms involving p on one side:
   p + p · eᶻ = eᶻ
   p (1 + eᶻ) = eᶻ

5. Solve for p:
   p = eᶻ / (1 + eᶻ)

6. Divide numerator and denominator by eᶻ:
   p = 1 / (e⁻ᶻ + 1) = 1 / (1 + e⁻ᶻ) = σ(z).

Thus, the inverse of the logit transformation is the standard logistic sigmoid function.`,
  },
  {
    id: 2,
    q: 'Derive the derivative of the sigmoid function dσ(z)/dz = σ(z)(1 − σ(z)).',
    answer: `Let σ(z) = (1 + e⁻ᶻ)⁻¹. Using the chain rule:

1. dσ/dz = −1 · (1 + e⁻ᶻ)⁻² · d/dz(1 + e⁻ᶻ)
         = −1 · (1 + e⁻ᶻ)⁻² · (−e⁻ᶻ)
         = e⁻ᶻ / (1 + e⁻ᶻ)²

2. Rewrite the fraction into two factors:
   dσ/dz = [ 1 / (1 + e⁻ᶻ) ] · [ e⁻ᶻ / (1 + e⁻ᶻ) ]

3. Notice that:
   e⁻ᶻ / (1 + e⁻ᶻ) = (1 + e⁻ᶻ − 1) / (1 + e⁻ᶻ)
                   = 1 − [ 1 / (1 + e⁻ᶻ) ]
                   = 1 − σ(z)

4. Substitute back:
   dσ/dz = σ(z) · (1 − σ(z)). ∎`,
  },
  {
    id: 3,
    q: 'Formulate the Maximum Likelihood Estimation (MLE) principle for Bernoulli outcomes and derive the Binary Cross-Entropy loss function J(w, b).',
    answer: `1. For independent binary labels y⁽ⁱ⁾ ∈ {0, 1} with p⁽ⁱ⁾ = P(y⁽ⁱ⁾ = 1 | x⁽ⁱ⁾), the probability of observing y⁽ⁱ⁾ is given by the Bernoulli PMF:
   P(y⁽ⁱ⁾ | x⁽ⁱ⁾) = (p⁽ⁱ⁾)^(y⁽ⁱ⁾) · (1 − p⁽ⁱ⁾)^(1 − y⁽ⁱ⁾)

2. The joint likelihood of all m independent training samples is:
   L(w, b) = ∏ [ (p⁽ⁱ⁾)^(y⁽ⁱ⁾) · (1 − p⁽ⁱ⁾)^(1 − y⁽ⁱ⁾) ] (for i=1 to m)

3. Taking the natural log gives the log-likelihood:
   ℓ(w, b) = ∑ [ y⁽ⁱ⁾ ln(p⁽ⁱ⁾) + (1 − y⁽ⁱ⁾) ln(1 − p⁽ⁱ⁾) ]

4. In machine learning, we minimise cost rather than maximise likelihood. We define Binary Cross-Entropy (BCE) as the scaled negative log-likelihood:
   J(w, b) = −(1/m) ℓ(w, b)
           = −(1/m) ∑ [ y⁽ⁱ⁾ ln(p⁽ⁱ⁾) + (1 − y⁽ⁱ⁾) ln(1 − p⁽ⁱ⁾) ].

This loss function penalises confident wrong predictions asymptotically toward infinity.`,
  },
  {
    id: 4,
    q: 'Derive the gradient of the Binary Cross-Entropy loss with respect to weight w_j: ∇_w_j J(w, b) = (1/m) ∑ (p⁽ⁱ⁾ − y⁽ⁱ⁾) x_j⁽ⁱ⁾.',
    answer: `For a single sample i, let L⁽ⁱ⁾ = −[ y⁽ⁱ⁾ ln(p⁽ⁱ⁾) + (1 − y⁽ⁱ⁾) ln(1 − p⁽ⁱ⁾) ] where:
  z⁽ⁱ⁾ = wᵀx⁽ⁱ⁾ + b   and   p⁽ⁱ⁾ = σ(z⁽ⁱ⁾).

By the multivariate chain rule:
  ∂L⁽ⁱ⁾ / ∂w_j = (∂L⁽ⁱ⁾ / ∂p⁽ⁱ⁾) · (∂p⁽ⁱ⁾ / ∂z⁽ⁱ⁾) · (∂z⁽ⁱ⁾ / ∂w_j)

1. Compute ∂L⁽ⁱ⁾ / ∂p⁽ⁱ⁾:
   ∂L⁽ⁱ⁾ / ∂p⁽ⁱ⁾ = − [ y⁽ⁱ⁾ / p⁽ⁱ⁾ − (1 − y⁽ⁱ⁾) / (1 − p⁽ⁱ⁾) ]
                 = − [ y⁽ⁱ⁾(1 − p⁽ⁱ⁾) − (1 − y⁽ⁱ⁾)p⁽ⁱ⁾ ] / [ p⁽ⁱ⁾(1 − p⁽ⁱ⁾) ]
                 = − [ y⁽ⁱ⁾ − p⁽ⁱ⁾ ] / [ p⁽ⁱ⁾(1 − p⁽ⁱ⁾) ]
                 = (p⁽ⁱ⁾ − y⁽ⁱ⁾) / [ p⁽ⁱ⁾(1 − p⁽ⁱ⁾) ]

2. Compute ∂p⁽ⁱ⁾ / ∂z⁽ⁱ⁾:
   From question T2, ∂p⁽ⁱ⁾ / ∂z⁽ⁱ⁾ = p⁽ⁱ⁾(1 − p⁽ⁱ⁾)

3. Compute ∂z⁽ⁱ⁾ / ∂w_j:
   ∂(∑ w_k x_k⁽ⁱ⁾ + b) / ∂w_j = x_j⁽ⁱ⁾

4. Multiply terms together:
   ∂L⁽ⁱ⁾ / ∂w_j = [ (p⁽ⁱ⁾ − y⁽ⁱ⁾) / (p⁽ⁱ⁾(1 − p⁽ⁱ⁾)) ] · [ p⁽ⁱ⁾(1 − p⁽ⁱ⁾) ] · x_j⁽ⁱ⁾
                 = (p⁽ⁱ⁾ − y⁽ⁱ⁾) · x_j⁽ⁱ⁾

5. Summing over all m samples and multiplying by (1/m):
   ∂J / ∂w_j = (1/m) ∑ (p⁽ⁱ⁾ − y⁽ⁱ⁾) x_j⁽ⁱ⁾.

Remarkably, the gradient formula has the exact same algebraic form as linear regression, but with p⁽ⁱ⁾ = σ(wᵀx⁽ⁱ⁾ + b) instead of ŷ⁽ⁱ⁾ = wᵀx⁽ⁱ⁾ + b!`,
  },
  {
    id: 5,
    q: 'Explain what happens to logistic regression weights when the data is perfectly linearly separable, and how regularisation prevents this failure mode.',
    answer: `Suppose there exists a hyperplane that perfectly separates class 0 from class 1 (every approved applicant has income > $50k and rejected has < $50k).

1. The BCE loss is:
   J(w) = −(1/m) ∑ [ y⁽ⁱ⁾ ln(σ(wᵀx⁽ⁱ⁾)) + (1 − y⁽ⁱ⁾) ln(1 − σ(wᵀx⁽ⁱ⁾)) ]

2. If we scale the weight vector w by a positive factor k:
   w_new = k · w

3. As k → ∞, for every sample with correct classification:
   • If y⁽ⁱ⁾ = 1: z⁽ⁱ⁾ → +∞, so σ(z⁽ⁱ⁾) → 1 and ln(σ(z⁽ⁱ⁾)) → 0.
   • If y⁽ⁱ⁾ = 0: z⁽ⁱ⁾ → −∞, so 1 − σ(z⁽ⁱ⁾) → 1 and ln(1 − σ(z⁽ⁱ⁾)) → 0.

4. Consequently, the loss J(k · w) approaches 0 as k → ∞!
   Standard gradient descent will push the weights toward infinity (‖w‖ → ∞), causing numeric overflow and an overconfident, step-function decision boundary with zero calibration.

How Regularisation Solves It:
Adding an L2 penalty (λ/2) ‖w‖₂² ensures the cost function penalises excessively large weights. The combined objective has a unique, finite global minimum, keeping probabilities smoothly calibrated and numerical operations stable.`,
  },
];

/* ─────────────────────────────────────────────
   MCQ CARD COMPONENT (Matching Chapter 1 & 2 Style)
───────────────────────────────────────────── */
function MCQCard({ item, index }: { item: (typeof MCQ)[0]; index: number }) {
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
   THEORY CARD COMPONENT (Matching Chapter 1 & 2 Style)
───────────────────────────────────────────── */
function TheoryCard({ item, index }: { item: (typeof THEORY)[0]; index: number }) {
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
