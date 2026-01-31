# clustering_engine.py

import networkx as nx

class ClusteringEngine:
    """
    Builds graph from correlation matrix
    and finds connected components as links
    """

    def __init__(self, threshold):
        self.threshold = threshold

    def cluster(self, corr_df):
        G = nx.Graph()

        for cell in corr_df.columns:
            G.add_node(cell)

        for i in corr_df.index:
            for j in corr_df.columns:
                if i != j and corr_df.loc[i, j] > self.threshold:
                    G.add_edge(i, j, weight=float(corr_df.loc[i, j]))

        clusters = list(nx.connected_components(G))

        link_map = {}
        for idx, group in enumerate(clusters, start=1):
            link_map[f"Link_{idx}"] = sorted(list(group))

        return link_map
