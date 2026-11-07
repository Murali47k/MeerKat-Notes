"""
Decision Tree Splitting Animation
Render using Manim Community Edition:
    manim -pql decision_trees.py DecisionTreeSplitScene
"""

try:
    from manim import *
except ImportError:
    pass

class DecisionTreeSplitScene(Scene):
    def construct(self):
        title = Title("Decision Tree: Feature Space Partitioning", color=WHITE)
        self.play(Write(title))

        # 2D Feature plane [x1, x2]
        plane = NumberPlane(
            x_range=[-4, 4, 1],
            y_range=[-3, 3, 1],
            x_length=6.5,
            y_length=5,
            background_line_style={"stroke_opacity": 0.3}
        ).to_edge(LEFT)
        self.play(Create(plane))

        # Class 0 (Blue dots) and Class 1 (Orange squares)
        class_0 = VGroup(*[
            Dot(plane.c2p(x, y), color=BLUE, radius=0.08)
            for x, y in [(-3, 1), (-2, 2), (-2, -1), (-1, 0.5), (-1, -1.5)]
        ])
        class_1 = VGroup(*[
            Square(side_length=0.15, color=ORANGE, fill_opacity=0.8).move_to(plane.c2p(x, y))
            for x, y in [(1, 2), (2, 1), (3, 0), (2, -2), (1.5, -1)]
        ])
        self.play(FadeIn(class_0), FadeIn(class_1))

        # First Decision Boundary Split (e.g. x1 = 0)
        split_line = DashedLine(
            plane.c2p(0, -3), plane.c2p(0, 3),
            color=YELLOW, stroke_width=4
        )
        split_label = MathTex(r"x_1 \le 0", color=YELLOW, font_size=30).next_to(split_line, UP)
        self.play(Create(split_line), Write(split_label))

        # Gini Impurity calculation card on the right
        card = Rectangle(width=4, height=3, color=GRAY).to_edge(RIGHT)
        gini_text = MathTex(
            r"Gini = 1 - \sum p_i^2",
            color=GREEN_B,
            font_size=32
        ).move_to(card.get_center())

        self.play(Create(card), Write(gini_text))
        self.wait(2)
