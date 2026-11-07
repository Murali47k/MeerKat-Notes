import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import os

# Set dark/modern aesthetic
plt.style.use('dark_background')
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), facecolor='#09090b')

# True line and noisy data
np.random.seed(42)
x = np.linspace(0, 10, 25)
y = 2.5 * x + 5 + np.random.normal(0, 2.5, size=x.shape)

# Gradient Descent Simulation
epochs = 50
learning_rate = 0.015
# normalized x for stability
x_norm = (x - x.mean()) / x.std()
y_norm = (y - y.mean()) / y.std()

w = -1.5
b = 0.0
w_history = [w]
loss_history = []

def compute_loss(w_val):
    return np.mean((w_val * x_norm - y_norm)**2)

w_range = np.linspace(-3, 3, 100)
loss_curve = [compute_loss(val) for val in w_range]

history_w = []
history_loss = []

for _ in range(epochs):
    preds = w * x_norm + b
    dw = np.mean(2 * (preds - y_norm) * x_norm)
    db = np.mean(2 * (preds - y_norm))
    w -= learning_rate * dw
    b -= learning_rate * db
    history_w.append(w)
    history_loss.append(compute_loss(w))

def update(frame):
    ax1.clear()
    ax2.clear()

    ax1.set_facecolor('#09090b')
    ax2.set_facecolor('#09090b')

    # Un-normalize parameters for display on ax1
    curr_w = history_w[frame]
    w_unnorm = curr_w * (y.std() / x.std())
    b_unnorm = y.mean() - w_unnorm * x.mean()

    # Left plot: Data & Fitted Line
    ax1.scatter(x, y, color='#38bdf8', s=45, alpha=0.9, label='Observed Data', edgecolors='#0284c7')
    x_line = np.array([0, 10])
    y_line = w_unnorm * x_line + b_unnorm
    ax1.plot(x_line, y_line, color='#f43f5e', lw=2.5, label=f'Model: y = {w_unnorm:.2f}x + {b_unnorm:.2f}')
    
    # Residuals
    y_preds = w_unnorm * x + b_unnorm
    for xi, yi, y_pred in zip(x, y, y_preds):
        ax1.plot([xi, xi], [yi, y_pred], color='#71717a', linestyle='--', alpha=0.5, lw=1)

    ax1.set_xlim(-0.5, 10.5)
    ax1.set_ylim(-2, 35)
    ax1.set_title(f'Iteration {frame + 1} / {epochs}', color='#e4e4e7', fontsize=12, pad=10)
    ax1.set_xlabel('Feature x', color='#a1a1aa')
    ax1.set_ylabel('Target y', color='#a1a1aa')
    ax1.tick_params(colors='#71717a')
    ax1.legend(loc='upper left', framealpha=0.2)

    # Right plot: Loss Landscape J(w)
    ax2.plot(w_range, loss_curve, color='#a855f7', lw=2, label='Cost Function J(w)')
    curr_loss = history_loss[frame]
    ax2.scatter(curr_w, curr_loss, color='#e11d48', s=90, zorder=5, label='Current State')
    ax2.plot(history_w[:frame+1], history_loss[:frame+1], color='#fb7185', linestyle=':', lw=1.5, alpha=0.7)

    ax2.set_xlim(-3.2, 3.2)
    ax2.set_ylim(-0.1, max(loss_curve)*1.1)
    ax2.set_title(f'MSE Loss: {curr_loss:.4f}', color='#e4e4e7', fontsize=12, pad=10)
    ax2.set_xlabel('Weight parameter (w)', color='#a1a1aa')
    ax2.set_ylabel('Loss J(w)', color='#a1a1aa')
    ax2.tick_params(colors='#71717a')
    ax2.legend(loc='upper right', framealpha=0.2)

    plt.tight_layout()

ani = animation.FuncAnimation(fig, update, frames=len(history_w), interval=80)
out_path = 'public/animations/linear-regression/gradient-descent.mp4'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
ani.save(out_path, writer='ffmpeg', fps=15, dpi=120)
print(f'Successfully generated animation video at {out_path}')
