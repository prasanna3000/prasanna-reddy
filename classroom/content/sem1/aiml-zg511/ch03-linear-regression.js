/* Classroom content: plain JSON wrapped in ClassroomContent(...) so it loads from file:// too. */
ClassroomContent({
  "id": "ch03",
  "title": "Linear Neural Networks for Regression",
  "subtitle": "Contact session 3 · T1 Chapter 3 + Chapter 12 (12.1–12.3) · Lab 1: Auto MPG",
  "sources": [
    "M3 slide deck",
    "Lecture 3 transcript (8 Aug 2026)",
    "Course handout",
    "D2L Ch 3 and Ch 12",
    "Companion Book 3",
    "DNN Handbook",
    "Practice set Q3.1–Q3.10"
  ],
  "lesson": [
    {
      "title": "What regression is",
      "lead": "Regression is supervised learning that predicts a **continuous** number from input features.",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Input: a feature vector **x ∈ Rᵈ**. Output: a real number **y ∈ R**.",
            "Goal: learn a function **f : Rᵈ → R** so that y ≈ f(x).",
            "Examples: house price (size, location, rooms), temperature (history, season, humidity), stock price (past prices, volume, indicators)."
          ]
        },
        {
          "type": "h",
          "text": "Regression or classification?"
        },
        {
          "type": "p",
          "text": "Look at the **target**, not the topic. If it is a continuous number, the task is regression. If it is one of a few labels (class A / class B, 1 / 2), the task is classification."
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "Hours studied → marks scored is regression: every new x gives a different, continuous ŷ. If the target only takes values like 1 or 2, it becomes classification."
        },
        {
          "type": "h",
          "text": "From guessing to learning"
        },
        {
          "type": "p",
          "text": "In class we fitted a line to (hours, marks) data by **guessing** weights and computing the error each time: (0, 1) → MSE ≈ 9.67, (1, 3) → 16.7, (0.5, 2) → 0.25. Keep whichever guess has the smallest error."
        },
        {
          "type": "p",
          "text": "That works, but it is the **worst** method. Gradient descent replaces guessing with a rule that tells each weight which way to move."
        }
      ]
    },
    {
      "title": "The linear model",
      "lead": "Linear regression assumes the output is a **weighted sum** of the inputs plus a bias.",
      "blocks": [
        {
          "type": "formula",
          "text": "ŷ = w₀ + w₁x₁ + w₂x₂ + … + w_d x_d  =  wᵀx"
        },
        {
          "type": "list",
          "items": [
            "**w₁ … w_d** are the weights: how much each feature matters.",
            "**w₀** is the bias, also called the intercept, offset, b or c.",
            "**Linear** means every feature appears to the power 1. There are no x², no x₁x₂.",
            "With one feature this is just y = mx + c: the slope m is w₁ and the intercept c is w₀. Slope and weight are the same thing."
          ]
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "The slope decides the line's **angle**. The intercept moves the line **up or down**. For house prices, locality and rooms get big weights; the floor number gets a small one."
        },
        {
          "type": "h",
          "text": "Examples from the slides"
        },
        {
          "type": "table",
          "head": [
            "Problem",
            "Model"
          ],
          "rows": [
            [
              "Salary",
              "w₀ + w₁ · years of experience"
            ],
            [
              "Crop yield",
              "w₀ + w₁ · rainfall + w₂ · fertilizer"
            ],
            [
              "Energy use",
              "w₀ + w₁ · temperature + w₂ · hour + w₃ · day"
            ]
          ]
        },
        {
          "type": "p",
          "text": "Textbook note (D2L 3.1.1): strictly, wᵀx + b is an **affine** map, meaning linear plus a shift. The bias lets the line miss the origin."
        },
        {
          "type": "p",
          "text": "**The goal:** find the best combination of w₀, w₁, …, w_d, i.e. the line or plane closest to all the data points."
        }
      ]
    },
    {
      "title": "Four parts and one neuron",
      "lead": "Every ML system has four parts. Here the model is a single neuron with an **identity activation**.",
      "blocks": [
        {
          "type": "steps",
          "items": [
            "**Data:** d-dimensional inputs and their targets.",
            "**Model:** one neuron computing a linear function.",
            "**Objective function:** the squared-error loss J(w).",
            "**Learning algorithm:** gradient descent, which optimises w."
          ]
        },
        {
          "type": "h",
          "text": "The neuron"
        },
        {
          "type": "p",
          "text": "The inputs 1, x₁, …, x_d are multiplied by w₀, w₁, …, w_d and added up (Σ). The sum z is passed through f to give ŷ = f(z)."
        },
        {
          "type": "formula",
          "text": "ŷ = f(wᵀx),   f(z) = z,   f′(z) = 1"
        },
        {
          "type": "list",
          "items": [
            "The identity output can be any real number (−∞, ∞), which suits prices and temperatures.",
            "It is differentiable everywhere, with f′ = 1, so the gradient passes through unchanged.",
            "Nothing is lost between input and output.",
            "D2L 3.1.4 calls this a **single-layer fully connected network** with one output neuron. There are no hidden layers."
          ]
        },
        {
          "type": "trap",
          "label": "Exam trap",
          "text": "**Why not a sigmoid?** Its output is trapped in (0, 1), so it can never output a price like 250. Its slope σ(1 − σ) is at most 0.25 and almost 0 for large z, so learning stalls. Example: z = 230 gives σ′ ≈ 10⁻¹⁰⁰."
        },
        {
          "type": "note",
          "label": "Companion book",
          "text": "Book 3's view: this is the perceptron with the step-function \"cliff\" removed. The output is z itself.",
          "color": "blue"
        }
      ]
    },
    {
      "title": "Data in matrix form",
      "lead": "Put a column of **1s** in front of the features so the bias becomes an ordinary weight. Then every prediction at once is **ŷ = Xw**.",
      "blocks": [
        {
          "type": "table",
          "head": [
            "Object",
            "Shape",
            "What it holds"
          ],
          "rows": [
            [
              "Design matrix **X**",
              "N × (d+1)",
              "One row per example, first column all 1s"
            ],
            [
              "Targets **y**",
              "N × 1",
              "y⁽¹⁾ … y⁽ᴺ⁾"
            ],
            [
              "Weights **w**",
              "(d+1) × 1",
              "w₀ (bias) first, then one weight per feature"
            ],
            [
              "Predictions **ŷ = Xw**",
              "N × 1",
              "One prediction per row"
            ],
            [
              "Errors **e = ŷ − y**",
              "N × 1",
              "Predicted minus actual"
            ],
            [
              "Gradient **∇J = Xᵀe / N**",
              "(d+1) × 1",
              "Same shape as w"
            ]
          ]
        },
        {
          "type": "h",
          "text": "Why Xᵀ? (asked in class)"
        },
        {
          "type": "list",
          "items": [
            "You can multiply (a × b)(b × c) only when the inner sizes match.",
            "Xw works: (N × (d+1)) · ((d+1) × 1) = N × 1. **wX does not work.**",
            "Xe does not work (N × (d+1) times N × 1). Xᵀe works: ((d+1) × N) · (N × 1) = (d+1) × 1.",
            "Row 1 of Xᵀ is all 1s, so the first entry of Xᵀe is **Σ eᵢ** (the bias gradient). Row j+1 gives **Σ eᵢ · xⱼ⁽ⁱ⁾**."
          ]
        },
        {
          "type": "p",
          "text": "**Vectorise:** one matrix operation beats a Python loop. In D2L, adding two 10,000-element vectors took 0.178 s with a loop and 0.00036 s with one `+`."
        }
      ]
    },
    {
      "title": "The loss: squared error",
      "lead": "Training minimises the mean squared error with a ½ in front. The ½ cancels the 2 when you differentiate.",
      "blocks": [
        {
          "type": "formula",
          "text": "ℓ⁽ⁱ⁾ = ½ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾)²",
          "caption": "loss for one example"
        },
        {
          "type": "formula",
          "text": "J(w) = (1/N) Σ ½ (wᵀx⁽ⁱ⁾ − y⁽ⁱ⁾)²  =  (1/2N) ‖Xw − y‖²",
          "caption": "total loss; goal: w* = argmin J(w)"
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "**Error** e = ŷ − y is a difference per example (a vector). **Loss** J = (1/2N)Σe² is one number for the whole dataset. Don't mix them up."
        },
        {
          "type": "h",
          "text": "Why squared error? (four reasons, slide 18)"
        },
        {
          "type": "steps",
          "items": [
            "**Differentiable:** smooth everywhere, so it is easy to optimise.",
            "**Convex** for a linear model: a bowl with a single global minimum.",
            "**Penalises large errors** quadratically. Squaring also stops + and − errors cancelling, though it makes the loss sensitive to outliers.",
            "**Maximum likelihood** under Gaussian noise."
          ]
        },
        {
          "type": "h",
          "text": "The maximum likelihood link (D2L 3.1.3)"
        },
        {
          "type": "p",
          "text": "Assume y = wᵀx + b + ε with ε ~ N(0, σ²). The negative log-likelihood is Σ [½log(2πσ²) + (y − wᵀx − b)²/2σ²]. The first term does not depend on w, so **minimising MSE = maximum likelihood** under additive Gaussian noise."
        }
      ]
    },
    {
      "title": "The gradient",
      "lead": "Differentiate J with the chain rule: the 2 cancels the ½, then multiply by xⱼ.",
      "blocks": [
        {
          "type": "formula",
          "text": "∂J/∂wⱼ = (1/N) Σ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾) · xⱼ⁽ⁱ⁾        ∂J/∂w₀ = (1/N) Σ (ŷ⁽ⁱ⁾ − y⁽ⁱ⁾)"
        },
        {
          "type": "formula",
          "text": "∇J(w) = (1/N) Xᵀ (Xw − y)",
          "caption": "matrix form: the matrix product does the Σ for you"
        },
        {
          "type": "p",
          "text": "The sum form (eq. 9) and the matrix form (eq. 10) are the **same thing**. The square has gone because it was differentiated."
        },
        {
          "type": "trap",
          "label": "Exam trap",
          "text": "A past EC-2 paper wrote J = (1/2N)Σ(y − ŷ)². Then ∂J/∂w = **−**(1/N)Σ(y − ŷ)x: the same number, with the residual flipped. The update is **always** w − η∇J."
        },
        {
          "type": "trap",
          "label": "Convention clash",
          "text": "Book 3 uses L = mean(e²) with no ½, so its gradient is (2/N)Xᵀe. In the exam use the **slide** convention, (1/2N) and (1/N), unless the question says otherwise."
        }
      ]
    },
    {
      "title": "Gradient descent",
      "lead": "New weight = old weight − learning rate × gradient. The minus sign is there because the gradient points uphill.",
      "blocks": [
        {
          "type": "formula",
          "text": "w⁽ᵗ⁺¹⁾ = w⁽ᵗ⁾ − η ∇J(w⁽ᵗ⁾)  =  w⁽ᵗ⁾ − (η/N) Xᵀ(Xw⁽ᵗ⁾ − y)"
        },
        {
          "type": "h",
          "text": "Batch gradient descent (slide 21)"
        },
        {
          "type": "steps",
          "items": [
            "Initialise w⁽⁰⁾ = 0 (or random). Set t = 0.",
            "Gradient over **all N** examples: ∇J = (1/N)Xᵀ(Xw⁽ᵗ⁾ − y).",
            "Update: w⁽ᵗ⁺¹⁾ = w⁽ᵗ⁾ − η∇J.",
            "If a stopping rule fires, stop. Otherwise t ← t + 1 and repeat."
          ]
        },
        {
          "type": "p",
          "text": "**Batch** means each step uses the whole training set, so one step = one epoch. Stochastic and mini-batch GD come in Module 4."
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "Quick drills from class: w = 5, η = 0.5, gradient 10 → w = 0. Then w = 0, η = 0.2, gradient −1 → w = 0.2."
        },
        {
          "type": "h",
          "text": "Watch it happen"
        },
        {
          "type": "widget",
          "widget": "gd-linear",
          "config": {
            "data": "1, 2\n2, 4\n3, 5",
            "eta": 0.1,
            "w0": "0, 0"
          }
        }
      ]
    },
    {
      "title": "The learning rate η",
      "lead": "η is the step size, a **hyperparameter** that you set. It is not learned.",
      "blocks": [
        {
          "type": "list",
          "items": [
            "**Too large:** overshoots the minimum, oscillates, can diverge to NaN.",
            "**Too small:** converges slowly and needs many iterations.",
            "Usually between 0 and 1. Try 0.001, 0.01, 0.1, 1 and plot the loss for each."
          ]
        },
        {
          "type": "h",
          "text": "The exact rule on a 1-D bowl"
        },
        {
          "type": "p",
          "text": "For J(w) = (c/2)(w − w*)², every step multiplies the gap (w − w*) by **(1 − ηc)**. So:"
        },
        {
          "type": "table",
          "head": [
            "η",
            "1 − ηc",
            "Behaviour"
          ],
          "rows": [
            [
              "η < 1/c",
              "between 0 and 1",
              "Converges from one side (slowly if close to 1)"
            ],
            [
              "η = 1/c",
              "0",
              "Lands on the minimum in **one** step"
            ],
            [
              "1/c < η < 2/c",
              "between −1 and 0",
              "Overshoots and bounces, but converges"
            ],
            [
              "η > 2/c",
              "less than −1",
              "**Diverges**: the loss explodes"
            ]
          ]
        },
        {
          "type": "p",
          "text": "The loss shrinks by (1 − ηc)² per step, so take the √ of a loss ratio to get |1 − ηc|. In several dimensions the condition is η < 2/λ_max."
        },
        {
          "type": "widget",
          "widget": "lr-bowl",
          "config": {
            "c": 4,
            "wstar": 2,
            "w0": -2,
            "eta": 0.15,
            "steps": 8
          }
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "The teacher's picture: a ball in a bowl. Long jumps can miss the bottom and fly out. Baby steps get there, but late."
        }
      ]
    },
    {
      "title": "When to stop",
      "lead": "The deck gives **four** stopping criteria. List all four in an answer.",
      "blocks": [
        {
          "type": "steps",
          "items": [
            "**Gradient magnitude:** ‖∇J‖ < ε (e.g. ε = 10⁻⁴).",
            "**Loss change:** |J⁽ᵗ⁾ − J⁽ᵗ⁻¹⁾| < ε.",
            "**Maximum iterations** reached (e.g. T = 1000 or 10,000).",
            "**Validation loss starts rising:** early stopping, against overfitting."
          ]
        },
        {
          "type": "p",
          "text": "The loss-change rule usually fires first, because the loss change shrinks like the gradient **squared**."
        },
        {
          "type": "note",
          "label": "Teacher says",
          "text": "In class: \"actually here it should be the loss function\" (about slide 21). A loss curve can wobble up and down before it settles, which is why you watch the trend."
        },
        {
          "type": "trap",
          "label": "Exam trap",
          "text": "Early stopping keeps the weights at the validation **minimum**, not at the first epoch where it rises."
        }
      ]
    },
    {
      "title": "Evaluating the model",
      "lead": "Judge the model on **unseen** test data. Generalisation is the real goal.",
      "blocks": [
        {
          "type": "p",
          "text": "Split: training set to learn w (typically 90–99%), test set to measure generalisation (1–10%)."
        },
        {
          "type": "table",
          "head": [
            "Metric",
            "Formula",
            "Note"
          ],
          "rows": [
            [
              "MSE",
              "(1/N) Σ (ŷ − y)²",
              "1/N, no ½"
            ],
            [
              "RMSE",
              "√MSE",
              "Same units as y: a typical miss"
            ],
            [
              "MAE",
              "(1/N) Σ |y − ŷ|",
              "Less sensitive to outliers"
            ],
            [
              "R²",
              "1 − SS_res / SS_tot",
              "SS_res = Σ(y − ŷ)², SS_tot = Σ(y − ȳ)²"
            ]
          ]
        },
        {
          "type": "list",
          "items": [
            "**R² = 1:** perfect fit. **R² = 0:** no better than predicting the mean ȳ. **R² < 0:** worse than the mean (possible on test data).",
            "0.7 < R² < 0.9 usually means a good fit.",
            "R² is the **proportion of variance explained**. It is not an accuracy."
          ]
        },
        {
          "type": "widget",
          "widget": "metrics-calc",
          "config": {
            "y": "4, 4.5, 8, 8, 10.5",
            "yhat": "3, 5, 7, 9, 11"
          }
        }
      ]
    },
    {
      "title": "Tips: scaling, init, debugging",
      "lead": "Feature scaling is the tip examiners test most. Without it, the bowl becomes a narrow valley and gradient descent zig-zags.",
      "blocks": [
        {
          "type": "formula",
          "text": "min-max:  x′ = (x − min) / (max − min)        z-score:  x′ = (x − μ) / σ"
        },
        {
          "type": "list",
          "items": [
            "Use the **population** σ (divide by N).",
            "Why it matters: the gradient for feature j is (1/N)Σ e·xⱼ, so it scales with the feature. The curvature along wⱼ is (1/N)Σxⱼ². With very different curvatures, no single η suits both directions.",
            "At test time, scale with the **training** mean and spread.",
            "Initialise with zeros (fine for linear regression). Avoid large starting values."
          ]
        },
        {
          "type": "widget",
          "widget": "feature-scaling",
          "config": {
            "columns": [
              {
                "name": "Area (sq ft)",
                "values": "1000, 1500, 2000, 2500"
              },
              {
                "name": "Bedrooms",
                "values": "1, 2, 2, 4"
              }
            ]
          }
        },
        {
          "type": "h",
          "text": "Debugging checklist (slide 41)"
        },
        {
          "type": "table",
          "head": [
            "Symptom",
            "Cause",
            "Fix"
          ],
          "rows": [
            [
              "Loss NaN / Inf",
              "η too large, overflow",
              "Lower η, scale features"
            ],
            [
              "Loss oscillating",
              "η too large",
              "Lower η or use decay"
            ],
            [
              "Loss not decreasing",
              "η too small, gradient sign bug, + instead of −",
              "Raise η, check the code"
            ],
            [
              "Train good, test bad",
              "Overfitting",
              "Regularise, more data, simpler model"
            ]
          ]
        }
      ]
    },
    {
      "title": "The shortcut: normal equation",
      "lead": "For this one model there is a closed form. It came up in a past EC-2 question.",
      "blocks": [
        {
          "type": "formula",
          "text": "Set ∇J = 0:  XᵀX w = Xᵀy   ⇒   w* = (XᵀX)⁻¹ Xᵀy"
        },
        {
          "type": "p",
          "text": "The solution is unique only when XᵀX is invertible, i.e. no feature is a linear combination of the others (full rank)."
        },
        {
          "type": "formula",
          "text": "One feature:  w₁ = (NΣxy − ΣxΣy) / (NΣx² − (Σx)²),    w₀ = (Σy − w₁Σx) / N"
        },
        {
          "type": "p",
          "text": "**Why bother with gradient descent?** Inverting XᵀX costs O(d³). More importantly, the closed form disappears once you add a nonlinearity, a hidden layer or a different loss. Gradient descent works for every model, which is why we learn it here, where we can still check it."
        },
        {
          "type": "note",
          "label": "Lab tip",
          "text": "Try **Show optimum** in the gradient-descent lab to see where the steps are heading.",
          "color": "blue"
        }
      ]
    },
    {
      "title": "Textbook extras (Ch 3 & 12)",
      "lead": "Fair game in an open-book theory question.",
      "blocks": [
        {
          "type": "h",
          "text": "Minibatch SGD (D2L 3.1)"
        },
        {
          "type": "p",
          "text": "Full batch is exact but slow. One example per step (SGD) is noisy and slow on hardware. **Minibatches** of 32–256 (powers of 2) are the compromise: (w,b) ← (w,b) − (η/|B|) Σ_{i∈B} ∂ℓ⁽ⁱ⁾. Batch size and η are hyperparameters tuned on a validation set."
        },
        {
          "type": "h",
          "text": "Generalisation (D2L 3.6)"
        },
        {
          "type": "list",
          "items": [
            "**Underfitting:** training and validation errors are both high, with a small gap; the model is too simple.",
            "**Overfitting:** training error is much lower than validation error.",
            "K-fold cross-validation: train K times on K−1 folds and average the validation error.",
            "More data almost always helps. All of this assumes IID data."
          ]
        },
        {
          "type": "h",
          "text": "Weight decay (D2L 3.7, comes back in session 15)"
        },
        {
          "type": "formula",
          "text": "minimise  J(w) + (λ/2)‖w‖²   ⇒   w ← (1 − ηλ) w − η∇J"
        },
        {
          "type": "h",
          "text": "Optimisation (D2L 12.1–12.3)"
        },
        {
          "type": "list",
          "items": [
            "Optimisation lowers the **training** error. Deep learning cares about the **generalisation** error.",
            "Challenges: local minima, saddle points (e.g. x³ at 0, or x² − y²), vanishing gradients.",
            "**Convex** functions: every local minimum is global. Check with f″ ≥ 0, or a positive semidefinite Hessian. Jensen: E[f(X)] ≥ f(E[X]).",
            "Taylor view: f(x − ηf′) ≈ f(x) − ηf′², which is lower than f(x) for small η.",
            "D2L demo on f(x) = x² from x = 10, 10 steps: η = 0.2 → 0.06; η = 0.05 → 3.49 (slow); η = 1.1 → 61.9 (diverges).",
            "Preconditioning rescales badly scaled coordinates, the same idea as feature scaling. Newton's method is fast on convex problems but risky on non-convex ones."
          ]
        }
      ]
    },
    {
      "title": "Exam game plan",
      "lead": "Most of the marks come from hand calculation. Practise until each one is a routine.",
      "blocks": [
        {
          "type": "note",
          "label": "Teacher says",
          "text": "\"In paper, maximum we may ask for **two steps**.\" The learning rate is given. If the initial weights aren't, choose some (zeros) and say so. Matrices are small (about 4–5 rows)."
        },
        {
          "type": "h",
          "text": "The routine for one gradient-descent iteration"
        },
        {
          "type": "steps",
          "items": [
            "Write X (with the 1s column), y and w with their **shapes**.",
            "ŷ = Xw.",
            "e = ŷ − y.",
            "J = ‖e‖² / 2N.",
            "Xᵀe: Σe, then Σe·x₁, Σe·x₂, …",
            "∇J = Xᵀe / N.",
            "w_new = w − η∇J.",
            "New ŷ, new e, new J. Say that J fell, and by what %."
          ]
        },
        {
          "type": "h",
          "text": "Where marks are lost"
        },
        {
          "type": "list",
          "items": [
            "Adding η∇J instead of subtracting it. If the loss rises after a small step, your sign is wrong.",
            "Forgetting 1/N in the gradient or the ½ in J. (The MSE **metric** has no ½.)",
            "Leaving out the 1s column, so the bias never gets a gradient.",
            "Predicting a new point with w⁽⁰⁾ instead of the updated w.",
            "Using N − 1 in the z-score.",
            "Listing only \"max iterations\" as a stopping rule."
          ]
        }
      ]
    }
  ],
  "worked": [
    {
      "title": "The lecture example: two iterations",
      "tags": [
        "slides 26–30",
        "batch GD"
      ],
      "problem": [
        {
          "type": "p",
          "text": "House price from size: x = 1, 2, 3 and y = 2, 4, 5. Use η = 0.1 and start from w⁽⁰⁾ = (0, 0). Do **two** iterations of batch gradient descent with J = (1/2N)‖Xw − y‖²."
        }
      ],
      "steps": [
        {
          "label": "Set up",
          "text": "X = [[1,1],[1,2],[1,3]] (3 × 2), y = (2, 4, 5)ᵀ, w = (0, 0)ᵀ, N = 3."
        },
        {
          "label": "Predict & error",
          "text": "ŷ⁽⁰⁾ = Xw = (0, 0, 0). e = ŷ − y = (−2, −4, −5)."
        },
        {
          "label": "Loss",
          "text": "J = (4 + 16 + 25) / 6 = **7.5**"
        },
        {
          "label": "Gradient",
          "text": "Xᵀe = (−2−4−5, −2−8−15) = (−11, −25). ∇J = (−11, −25)/3 = **(−3.667, −8.333)**"
        },
        {
          "label": "Update 1",
          "text": "w⁽¹⁾ = (0, 0) − 0.1·(−3.667, −8.333) = **(0.367, 0.833)**"
        },
        {
          "label": "Check",
          "text": "ŷ⁽¹⁾ = (1.20, 2.03, 2.87), e = (−0.80, −1.97, −2.13), J = 9.06/6 = **1.51** (80% drop)"
        },
        {
          "label": "Gradient 2",
          "text": "Xᵀe = (−4.90, −11.133). ∇J = **(−1.633, −3.711)**"
        },
        {
          "label": "Update 2",
          "text": "w⁽²⁾ = (0.367, 0.833) + 0.1·(1.633, 3.711) = **(0.530, 1.204)**"
        },
        {
          "label": "Check",
          "text": "ŷ⁽²⁾ = (1.734, 2.939, 4.143), e = (−0.266, −1.061, −0.857), J = **0.322**"
        }
      ],
      "answer": "w⁽²⁾ = (0.530, 1.204). The loss goes 7.5 → 1.51 → 0.322. The optimum is w* = (0.667, 1.5) with J* = 0.028. (The slide multiplies w first; it must be X first. The lecture's \"0.5\" and \"1.2, 2.3, 3.8\" were slips.)"
    },
    {
      "title": "Past EC-2 Q4: update, then the normal equation",
      "tags": [
        "past paper",
        "6 marks"
      ],
      "problem": [
        {
          "type": "p",
          "text": "Data (1,2), (2,5), (4,11), (5,14). Model ŷ = w₀ + w₁x, J = (1/2N)Σ(y − ŷ)², N = 4, η = 0.05, start at w = (1, −1). (a) Gradient at the start. (b) One batch update. (c) The optimum by the normal equations. Did the update move toward it?"
        }
      ],
      "steps": [
        {
          "label": "Predict",
          "text": "ŷ = 1 − x → (0, −1, −3, −4). Residuals r = y − ŷ = (2, 6, 14, 18). Σr = 40, Σr·x = 160."
        },
        {
          "label": "Loss",
          "text": "J = (4 + 36 + 196 + 324)/8 = **70.0**"
        },
        {
          "label": "Gradient",
          "text": "∂J/∂w₀ = −Σr/N = **−10**, ∂J/∂w₁ = −Σrx/N = **−40** (minus sign because r = y − ŷ)"
        },
        {
          "label": "Update",
          "text": "w₀ = 1 − 0.05(−10) = **1.5**, w₁ = −1 − 0.05(−40) = **1.0**. New J = 89/8 = 11.125 (84% drop)."
        },
        {
          "label": "Sums",
          "text": "Σx = 12, Σy = 32, Σxy = 126, Σx² = 46"
        },
        {
          "label": "Normal eq.",
          "text": "w₁ = (4·126 − 12·32)/(4·46 − 144) = 120/40 = **3**. w₀ = (32 − 36)/4 = **−1**"
        },
        {
          "label": "Direction",
          "text": "Distance to the optimum: √(2² + 4²) = 4.47 → √(2.5² + 2²) = 3.20, so closer overall. But w₀ moved **away** (1 → 1.5, while the optimum is −1)."
        }
      ],
      "answer": "Gradient (−10, −40); w = (1.5, 1.0) with J = 11.125; optimum ŷ = −1 + 3x with J* = 0 (the points are collinear). w₀ moves the wrong way because large positive x makes the bowl a tilted ellipse. Centring x fixes it."
    },
    {
      "title": "Fresh practice: four points, two steps",
      "tags": [
        "new numbers",
        "batch GD"
      ],
      "problem": [
        {
          "type": "p",
          "text": "x = 1, 2, 3, 4 and y = 3, 5, 6, 9. η = 0.05, w⁽⁰⁾ = (0, 0). Do two iterations and report J after each. Check your work in the Lab bench."
        }
      ],
      "steps": [
        {
          "label": "Iteration 0",
          "text": "ŷ = 0, e = (−3, −5, −6, −9), J = 151/8 = **18.875**"
        },
        {
          "label": "Gradient",
          "text": "Xᵀe = (−23, −67). ∇J = (−5.75, −16.75)"
        },
        {
          "label": "Update 1",
          "text": "w⁽¹⁾ = (0.2875, 0.8375). ŷ = (1.125, 1.9625, 2.8, 3.6375), J = **6.467**"
        },
        {
          "label": "Gradient 2",
          "text": "e = (−1.875, −3.0375, −3.2, −5.3625). Xᵀe = (−13.475, −39.0). ∇J = (−3.369, −9.75)"
        },
        {
          "label": "Update 2",
          "text": "w⁽²⁾ = (0.4559, 1.325), J = **2.257**"
        }
      ],
      "answer": "J goes 18.875 → 6.467 → 2.257. The optimum is ŷ = 1 + 1.9x."
    },
    {
      "title": "Two features, one update",
      "tags": [
        "matrix form",
        "d = 2"
      ],
      "problem": [
        {
          "type": "p",
          "text": "Rows (x₁, x₂, y): (1, 2, 6), (2, 1, 5), (3, 3, 10). w⁽⁰⁾ = (1, 1, 1) (bias first), η = 0.1. Do one update."
        }
      ],
      "steps": [
        {
          "label": "Shapes",
          "text": "X is 3 × 3 (1s column, x₁, x₂). w is 3 × 1. ŷ is 3 × 1."
        },
        {
          "label": "Predict",
          "text": "ŷ = (1+1+2, 1+2+1, 1+3+3) = (4, 4, 7). e = (−2, −1, −3). J = 14/6 = **2.333**"
        },
        {
          "label": "Xᵀe",
          "text": "(Σe, Σe·x₁, Σe·x₂) = (−6, −2−2−9, −4−1−9) = (−6, −13, −14)"
        },
        {
          "label": "Gradient",
          "text": "∇J = (−2, −4.333, −4.667)"
        },
        {
          "label": "Update",
          "text": "w⁽¹⁾ = (1.2, 1.4333, 1.4667). New ŷ = (5.567, 5.533, 9.9), J = **0.080**"
        }
      ],
      "answer": "w⁽¹⁾ = (1.2, 1.433, 1.467). J falls from 2.333 to 0.080 (a 97% drop)."
    },
    {
      "title": "Metrics on a test set",
      "tags": [
        "MSE",
        "R²"
      ],
      "problem": [
        {
          "type": "p",
          "text": "A trained model ŷ = 3x − 1 is tested on x = 1, 2, 3, 4 with actual y = 2.5, 5, 8.5, 10. Find MSE, RMSE, MAE and R²."
        }
      ],
      "steps": [
        {
          "label": "Predict",
          "text": "ŷ = (2, 5, 8, 11). Residuals y − ŷ = (0.5, 0, 0.5, −1)."
        },
        {
          "label": "MSE / RMSE",
          "text": "MSE = (0.25 + 0 + 0.25 + 1)/4 = **0.375**. RMSE = **0.612**"
        },
        {
          "label": "MAE",
          "text": "MAE = (0.5 + 0 + 0.5 + 1)/4 = **0.5**"
        },
        {
          "label": "R²",
          "text": "ȳ = 6.5. SS_tot = 16 + 2.25 + 4 + 12.25 = 34.5. SS_res = 1.5. R² = 1 − 1.5/34.5 = **0.957**"
        }
      ],
      "answer": "MSE 0.375, RMSE 0.612, MAE 0.5, R² 0.957 (the model explains about 95.7% of the variance)."
    },
    {
      "title": "Recover η from a trajectory",
      "tags": [
        "reverse the rule"
      ],
      "problem": [
        {
          "type": "p",
          "text": "No-bias neuron ŷ = wx. Two examples, both with x = 1: y = 2 and y = 4. J = (1/2N)Σ(wx − y)². Recorded: w⁽⁰⁾ = 0, w⁽¹⁾ = 0.6. Find η, predict w⁽²⁾ and the shrink factor."
        }
      ],
      "steps": [
        {
          "label": "Expand J",
          "text": "J = ¼[(w − 2)² + (w − 4)²] = ½w² − 3w + 5 = ½(w − 3)² + 0.5. So c = 1, w* = 3, and dJ/dw = w − 3."
        },
        {
          "label": "η",
          "text": "g⁽⁰⁾ = 0 − 3 = −3. w⁽¹⁾ = 0 − η(−3) = 3η = 0.6, so **η = 0.2**"
        },
        {
          "label": "w⁽²⁾",
          "text": "g⁽¹⁾ = 0.6 − 3 = −2.4. w⁽²⁾ = 0.6 + 0.2·2.4 = **1.08**"
        },
        {
          "label": "Factor",
          "text": "1 − ηc = 1 − 0.2 = **0.8**: the gap 3 → 2.4 → 1.92 shrinks by 0.8 each step."
        }
      ],
      "answer": "η = 0.2, w⁽²⁾ = 1.08, gap factor 0.8. J* = 0.5 is not 0, because one w cannot fit both y = 2 and y = 4 at the same x."
    },
    {
      "title": "Scaling one feature",
      "tags": [
        "min-max",
        "z-score"
      ],
      "problem": [
        {
          "type": "p",
          "text": "Hours studied: 2, 4, 6, 8. Give the min-max and z-scores (population σ), and the raw curvature (1/N)Σx²."
        }
      ],
      "steps": [
        {
          "label": "Min-max",
          "text": "(x − 2)/6 → **0, 0.333, 0.667, 1**"
        },
        {
          "label": "μ, σ",
          "text": "μ = 5. Deviations (−3, −1, 1, 3). σ² = 20/4 = 5, σ = **2.236**"
        },
        {
          "label": "z",
          "text": "z = (−1.342, −0.447, 0.447, 1.342)"
        },
        {
          "label": "Curvature",
          "text": "(4 + 16 + 36 + 64)/4 = **30**. After z-scoring it is 1."
        }
      ],
      "answer": "Min-max (0, ⅓, ⅔, 1); z = (±0.447, ±1.342); curvature 30 → 1. (Using N − 1 gives σ = 2.582, which is wrong for this course.)"
    }
  ],
  "labs": [
    {
      "title": "Gradient-descent workbench",
      "intro": "Type any data set (more than one feature is fine), pick η and the start weights, and step through batch gradient descent. Every quantity you write in the exam is shown.",
      "tryThis": [
        "Load the lecture example (already filled in) and press Step twice. Compare with Worked problem 1.",
        "Set η = 0.5 and watch the loss. Then try 0.3.",
        "Paste `1, 2, 6` / `2, 1, 5` / `3, 3, 10` with start `1, 1, 1` to check Problem 4.",
        "Press **Show optimum** to see the normal-equation answer."
      ],
      "widget": "gd-linear",
      "config": {
        "data": "1, 2\n2, 4\n3, 5",
        "eta": 0.1,
        "w0": "0, 0"
      }
    },
    {
      "title": "Learning-rate playground",
      "intro": "On the bowl J = (c/2)(w − w*)², every step multiplies the gap by 1 − ηc. Use the presets to see the five behaviours.",
      "widget": "lr-bowl",
      "config": {
        "c": 4,
        "wstar": 2,
        "w0": -2,
        "eta": 0.15,
        "steps": 8
      }
    },
    {
      "title": "Metrics calculator",
      "intro": "Check your hand-worked MSE, RMSE, MAE and R² tables.",
      "widget": "metrics-calc",
      "config": {
        "y": "2.5, 5, 8.5, 10",
        "yhat": "2, 5, 8, 11"
      }
    },
    {
      "title": "Feature-scaling desk",
      "intro": "See min-max and z-scores, and why the raw curvature ratio makes gradient descent zig-zag.",
      "widget": "feature-scaling",
      "config": {
        "columns": [
          {
            "name": "Area (sq ft)",
            "values": "1000, 1500, 2000, 2500"
          },
          {
            "name": "Bedrooms",
            "values": "1, 2, 2, 4"
          }
        ]
      }
    }
  ],
  "flashcards": [
    {
      "tag": "Definition",
      "front": "What is regression?",
      "back": "Supervised learning that predicts a **continuous** output y ∈ R from features x ∈ Rᵈ."
    },
    {
      "tag": "Definition",
      "front": "What makes a model \"linear\"?",
      "back": "The output is a weighted sum of the features, each to the **power 1**: ŷ = w₀ + w₁x₁ + … + w_d x_d."
    },
    {
      "tag": "Concept",
      "front": "Slope vs weight: the same?",
      "back": "Yes. In y = mx + c, m is w₁ and c is the bias w₀."
    },
    {
      "tag": "Concept",
      "front": "The four parts of an ML system",
      "back": "Data · Model (one neuron) · Objective function (squared loss) · Learning algorithm (gradient descent)."
    },
    {
      "tag": "Concept",
      "front": "Which activation does a regression neuron use, and why?",
      "back": "Identity, f(z) = z: its output covers (−∞, ∞), f′ = 1 so the gradient flows unchanged, and nothing is lost."
    },
    {
      "tag": "Shapes",
      "front": "Shape of the design matrix X?",
      "back": "N × (d+1): one row per example, plus a first column of 1s for the bias."
    },
    {
      "tag": "Shapes",
      "front": "Why Xᵀe and not Xe?",
      "back": "Xe has mismatched inner sizes. Xᵀ is (d+1)×N and e is N×1, so Xᵀe is (d+1)×1, the shape of w."
    },
    {
      "tag": "Formula",
      "front": "Training loss J(w)",
      "back": "J = (1/2N)‖Xw − y‖² = (1/N)Σ ½(wᵀx⁽ⁱ⁾ − y⁽ⁱ⁾)²"
    },
    {
      "tag": "Formula",
      "front": "Gradient of J",
      "back": "∇J = (1/N) Xᵀ(Xw − y)"
    },
    {
      "tag": "Formula",
      "front": "Gradient-descent update",
      "back": "w⁽ᵗ⁺¹⁾ = w⁽ᵗ⁾ − η∇J(w⁽ᵗ⁾)"
    },
    {
      "tag": "Why",
      "front": "Why the ½ in the loss?",
      "back": "It cancels the 2 that appears when you differentiate the square."
    },
    {
      "tag": "Why",
      "front": "Four reasons for squared error",
      "back": "Differentiable · convex (one global minimum) · penalises big errors · maximum likelihood under Gaussian noise."
    },
    {
      "tag": "Concept",
      "front": "Error vs loss",
      "back": "Error e = ŷ − y, one per example (a vector). Loss J = (1/2N)Σe², one number."
    },
    {
      "tag": "Concept",
      "front": "What does \"batch\" gradient descent mean?",
      "back": "Each step uses **all** N training examples to compute the gradient. One step = one epoch."
    },
    {
      "tag": "Concept",
      "front": "Parameter vs hyperparameter",
      "back": "Parameters (w) are learned. Hyperparameters (η, iterations, ε, batch size) are set by you."
    },
    {
      "tag": "η",
      "front": "Learning rate too large?",
      "back": "Overshoots, oscillates, diverges, NaN."
    },
    {
      "tag": "η",
      "front": "Learning rate too small?",
      "back": "Slow convergence: it needs many iterations."
    },
    {
      "tag": "η",
      "front": "On J = (c/2)(w − w*)², when does GD converge?",
      "back": "When |1 − ηc| < 1, i.e. 0 < η < 2/c. One step at η = 1/c."
    },
    {
      "tag": "Stopping",
      "front": "The four stopping criteria",
      "back": "‖∇J‖ < ε · |ΔJ| < ε · max iterations · validation loss rises (early stopping)."
    },
    {
      "tag": "Metrics",
      "front": "RMSE vs MAE",
      "back": "RMSE = √MSE, which punishes big misses more. MAE = mean |error|, less sensitive to outliers. Both are in the units of y."
    },
    {
      "tag": "Metrics",
      "front": "R² = 0 means…",
      "back": "No better than always predicting the mean ȳ. R² < 0 means worse than that."
    },
    {
      "tag": "Scaling",
      "front": "Min-max and z-score formulas",
      "back": "(x − min)/(max − min) → [0, 1].   (x − μ)/σ → mean 0, variance 1 (population σ)."
    },
    {
      "tag": "Scaling",
      "front": "Why scale features?",
      "back": "Different scales give different curvatures, so the bowl becomes a long valley. GD then zig-zags and converges slowly."
    },
    {
      "tag": "Formula",
      "front": "Normal equation",
      "back": "w* = (XᵀX)⁻¹Xᵀy, unique if XᵀX is invertible (full rank)."
    },
    {
      "tag": "Debug",
      "front": "Loss is NaN. What do you do?",
      "back": "Lower η and scale the features (overflow)."
    },
    {
      "tag": "Debug",
      "front": "Loss is not decreasing. Causes?",
      "back": "η too small, a gradient sign bug, or + instead of − in the update."
    },
    {
      "tag": "Textbook",
      "front": "Minimising MSE is equivalent to…",
      "back": "Maximum likelihood estimation under additive Gaussian noise ε ~ N(0, σ²)."
    },
    {
      "tag": "Textbook",
      "front": "Convex function: key property",
      "back": "Every local minimum is a global minimum."
    }
  ],
  "quiz": [
    {
      "type": "mcq",
      "q": "Predicting tomorrow's temperature in °C is…",
      "options": [
        "Regression",
        "Binary classification",
        "Multi-class classification",
        "Clustering"
      ],
      "answer": 0,
      "explain": "The target is a continuous number."
    },
    {
      "type": "mcq",
      "q": "For N examples and d features, the design matrix X has shape…",
      "options": [
        "d × N",
        "N × d",
        "N × (d+1)",
        "(d+1) × (d+1)"
      ],
      "answer": 2,
      "explain": "One row per example, plus a column of 1s for the bias."
    },
    {
      "type": "mcq",
      "q": "The activation of a single-neuron regression model is…",
      "options": [
        "Sigmoid",
        "ReLU",
        "Identity f(z) = z",
        "Step"
      ],
      "answer": 2,
      "explain": "Its output covers (−∞, ∞), and f′ = 1."
    },
    {
      "type": "mcq",
      "q": "Which is the correct gradient of J = (1/2N)‖Xw − y‖²?",
      "options": [
        "(1/N) X(Xw − y)",
        "(1/N) Xᵀ(Xw − y)",
        "(2/N) Xᵀ(y − Xw)",
        "(1/2N) Xᵀ(Xw − y)"
      ],
      "answer": 1,
      "explain": "The 2 cancels the ½, and Xᵀ makes the shapes match."
    },
    {
      "type": "numeric",
      "q": "w = 5, η = 0.5 and ∂J/∂w = 10. What is the new w?",
      "answer": 0,
      "tolerance": 0.001,
      "explain": "5 − 0.5 × 10 = 0."
    },
    {
      "type": "numeric",
      "q": "x = (1, 2, 3), y = (2, 4, 5), w = (0, 0), J = (1/2N)‖Xw − y‖². What is J?",
      "answer": 7.5,
      "tolerance": 0.01,
      "explain": "(4 + 16 + 25)/6 = 7.5."
    },
    {
      "type": "numeric",
      "q": "Same data: after one step with η = 0.1, what is w₁ (the slope)?",
      "answer": 0.8333,
      "tolerance": 0.002,
      "explain": "∇J = (−11/3, −25/3), so w₁ = 0 − 0.1(−8.333) = 0.833."
    },
    {
      "type": "mcq",
      "q": "The training loss jumps 7.5 → 10.8 → 15.6 → 22.4. The best action is…",
      "options": [
        "Increase η",
        "Decrease η",
        "Train longer",
        "Add more features"
      ],
      "answer": 1,
      "explain": "The ratio is about 1.44 > 1, so it is diverging: η is too large."
    },
    {
      "type": "numeric",
      "q": "On the bowl J = (c/2)(w − w*)² with c = 5, what is the largest η that still converges?",
      "answer": 0.4,
      "tolerance": 0.001,
      "explain": "η < 2/c = 0.4."
    },
    {
      "type": "numeric",
      "q": "Same bowl (c = 5): which η reaches the minimum in exactly one step?",
      "answer": 0.2,
      "tolerance": 0.001,
      "explain": "η = 1/c = 0.2 makes 1 − ηc = 0."
    },
    {
      "type": "numeric",
      "q": "Residuals y − ŷ are (1, −0.5, 1, −1, −0.5). What is the MSE?",
      "answer": 0.7,
      "tolerance": 0.001,
      "explain": "(1 + 0.25 + 1 + 1 + 0.25)/5 = 0.7. The metric uses 1/N, with no ½."
    },
    {
      "type": "mcq",
      "q": "A model gets R² = −0.2 on the test set. This means…",
      "options": [
        "It explains 20% of the variance",
        "It is worse than predicting the mean",
        "It is a perfect fit",
        "There is a computation error, since R² is never negative"
      ],
      "answer": 1,
      "explain": "R² < 0: SS_res > SS_tot, so it does worse than ȳ."
    },
    {
      "type": "numeric",
      "q": "Z-score the value 8 in the column (2, 4, 6, 8) using the population σ.",
      "answer": 1.3416,
      "tolerance": 0.005,
      "explain": "μ = 5, σ = √5 = 2.236, z = 3/2.236 = 1.342."
    },
    {
      "type": "mcq",
      "q": "Which is NOT one of the deck's stopping criteria?",
      "options": [
        "‖∇J‖ < ε",
        "|J⁽ᵗ⁾ − J⁽ᵗ⁻¹⁾| < ε",
        "Training loss reaches exactly 0",
        "Validation loss starts rising"
      ],
      "answer": 2,
      "explain": "A zero loss may not exist. The four rules are gradient, loss change, max iterations and early stopping."
    },
    {
      "type": "mcq",
      "q": "Why is a sigmoid a poor output for predicting a price of 250?",
      "options": [
        "It is not differentiable",
        "Its output is stuck in (0, 1) and its slope is almost 0 for large z",
        "It makes the loss non-convex only for prices",
        "It needs more weights"
      ],
      "answer": 1,
      "explain": "The range can't reach 250, and σ′ ≈ 0 stalls learning."
    },
    {
      "type": "mcq",
      "q": "The learning rate is a…",
      "options": [
        "Parameter learned by gradient descent",
        "Hyperparameter set by you",
        "Feature of the data",
        "Part of the loss"
      ],
      "answer": 1,
      "explain": "It is not part of the data and is not learned in the loop."
    },
    {
      "type": "mcq",
      "q": "Minimising squared error on a linear model equals maximum likelihood when the noise is…",
      "options": [
        "Uniform",
        "Laplace (exponential)",
        "Gaussian",
        "Poisson"
      ],
      "answer": 2,
      "explain": "−log of a Gaussian likelihood is the squared error plus a constant (D2L 3.1.3)."
    },
    {
      "type": "numeric",
      "q": "Data (1,2), (2,5), (4,11), (5,14). What is the slope w₁ from the normal equation?",
      "answer": 3,
      "tolerance": 0.001,
      "explain": "(4·126 − 12·32)/(4·46 − 144) = 120/40 = 3."
    }
  ],
  "formulas": [
    {
      "name": "Model",
      "formula": "ŷ = f(wᵀx) = w₀ + w₁x₁ + … + w_d x_d,   f(z) = z,  f′ = 1"
    },
    {
      "name": "Vectorised",
      "formula": "ŷ = Xw   (X is N × (d+1) with a 1s column)"
    },
    {
      "name": "Per-example loss",
      "formula": "ℓ = ½(ŷ − y)²"
    },
    {
      "name": "Training loss",
      "formula": "J(w) = (1/2N)‖Xw − y‖²"
    },
    {
      "name": "Gradient",
      "formula": "∇J = (1/N) Xᵀ(Xw − y) = (1/N) Σ (wᵀx⁽ⁱ⁾ − y⁽ⁱ⁾) x⁽ⁱ⁾"
    },
    {
      "name": "Update",
      "formula": "w⁽ᵗ⁺¹⁾ = w⁽ᵗ⁾ − η∇J(w⁽ᵗ⁾)"
    },
    {
      "name": "Normal equation",
      "formula": "w* = (XᵀX)⁻¹Xᵀy",
      "note": "One feature: w₁ = (NΣxy − ΣxΣy)/(NΣx² − (Σx)²), w₀ = (Σy − w₁Σx)/N"
    },
    {
      "name": "Learning rate on a bowl",
      "formula": "gap × (1 − ηc) per step;  converges if 0 < η < 2/c;  one step if η = 1/c",
      "note": "The loss shrinks by (1 − ηc)²"
    },
    {
      "name": "Stopping rules",
      "formula": "‖∇J‖ < ε · |J⁽ᵗ⁾ − J⁽ᵗ⁻¹⁾| < ε · t = T_max · validation loss rises"
    },
    {
      "name": "MSE · RMSE · MAE",
      "formula": "(1/N)Σ(ŷ − y)²  ·  √MSE  ·  (1/N)Σ|y − ŷ|"
    },
    {
      "name": "R²",
      "formula": "1 − Σ(y − ŷ)² / Σ(y − ȳ)²"
    },
    {
      "name": "Scaling",
      "formula": "min-max (x − min)/(max − min)  ·  z-score (x − μ)/σ (population σ)"
    },
    {
      "name": "Weight decay",
      "formula": "J + (λ/2)‖w‖²  ⇒  w ← (1 − ηλ)w − η∇J"
    },
    {
      "name": "Dense layer parameters",
      "formula": "inputs × units + units"
    }
  ]
});
