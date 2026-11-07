"""
Linear Regression & Gradient Descent Animation
Render using Manim Community Edition:
    manim -pql linear_regression.py LinearRegressionScene
"""

try:
    from manim import *
except ImportError:
    # Fallback placeholder when running in environment without manimpango
    pass

class LinearRegressionScene(Scene):
    def construct(self):
        # 1. Title and Header
        title = Title("Linear Regression & Cost Minimization", color=WHITE)
        self.play(Write(title))
        self.wait(1)

        # 2. Coordinate System
        axes = Axes(
            x_range=[0, 10, 2],
            y_range=[0, 25, 5],
            x_length=6,
            y_length=4.5,
            axis_config={"color": BLUE_C},
        ).to_edge(LEFT, buff=0.8)

        labels = axes.get_axis_labels(x_label="x", y_label="y")
        self.play(Create(axes), Write(labels))

        # 3. Scatter Points
        data_points = [(1, 4), (2, 5), (3, 9), (4, 11), (5, 12), (6, 17), (7, 18), (8, 22)]
        dots = VGroup(*[
            Dot(axes.c2p(x, y), color=YELLOW, radius=0.08)
            for x, y in data_points
        ])
        self.play(FadeIn(dots, lag_ratio=0.1))

        # 4. Mathematical Model Equation
        eq_box = Rectangle(width=4.5, height=3, color=GRAY_B).to_edge(RIGHT, buff=0.8)
        hypothesis = MathTex(r"\hat{y} = b_0 + b_1 x", color=BLUE_B).move_to(eq_box.get_top() + DOWN * 0.6)
        cost_func = MathTex(
            r"J(b_0, b_1) = \frac{1}{2m} \sum_{i=1}^{m} (\hat{y}_i - y_i)^2",
            color=RED_B,
            font_size=28
        ).next_to(hypothesis, DOWN, buff=0.4)

        self.play(Create(eq_box), Write(hypothesis), Write(cost_func))
        self.wait(1)

        # 5. Regression Line
        # Initial bad fit
        line = axes.plot(lambda x: 1.0 * x + 2, color=RED_C, x_range=[0, 9])
        self.play(Create(line))
        self.wait(0.5)

        # Residuals
        residuals = VGroup(*[
            DashedLine(
                axes.c2p(x, y),
                axes.c2p(x, 1.0 * x + 2),
                color=RED_A,
                dash_length=0.05
            )
            for x, y in data_points
        ])
        self.play(Create(residuals))
        self.wait(1)

        # 6. Gradient Descent Optimization (Convergence)
        optimal_line = axes.plot(lambda x: 2.3 * x + 1.8, color=GREEN_C, x_range=[0, 9])
        optimal_residuals = VGroup(*[
            DashedLine(
                axes.c2p(x, y),
                axes.c2p(x, 2.3 * x + 1.8),
                color=GREEN_A,
                dash_length=0.05
            )
            for x, y in data_points
        ])

        grad_update = MathTex(
            r"b_j := b_j - \alpha \frac{\partial J}{\partial b_j}",
            color=GREEN_B,
            font_size=28
        ).next_to(cost_func, DOWN, buff=0.4)

        self.play(Write(grad_update))
        self.play(
            Transform(line, optimal_line),
            Transform(residuals, optimal_residuals),
            run_time=2.5
        )
        self.wait(2)
