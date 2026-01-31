# visualization.py

import matplotlib.pyplot as plt
import seaborn as sns

class Visualizer:
    """
    Generates correlation heatmap
    """

    def save_heatmap(self, corr_df, output_path):
        plt.figure(figsize=(10, 8))
        sns.heatmap(corr_df, cmap="coolwarm", square=True)
        plt.title("Cell Correlation Heatmap")
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()

