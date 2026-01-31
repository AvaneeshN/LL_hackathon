# visualization.py

import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx


class Visualizer:
    def save_heatmap(self, corr_df, output_path):
        plt.figure(figsize=(10, 8))
        sns.heatmap(corr_df, cmap="coolwarm", square=True)
        plt.title("Cell Correlation Heatmap")
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()

    def save_topology_graph(self, link_map, confidences, output_path):
        G = nx.Graph()

        for link, cells in link_map.items():
            for cell in cells:
                G.add_node(cell)

            for i in range(len(cells)):
                for j in range(i + 1, len(cells)):
                    G.add_edge(cells[i], cells[j], label=link)

        plt.figure(figsize=(10, 8))
        pos = nx.spring_layout(G, seed=42)

        nx.draw(
            G,
            pos,
            with_labels=True,
            node_size=800,
            node_color="lightblue",
            font_size=8
        )

        plt.title("Inferred Fronthaul Topology")
        plt.tight_layout()
        plt.savefig(output_path)
        plt.close()


