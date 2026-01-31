# clustering_engine.py

class ClusteringEngine:
    """
    Groups cells into links based on correlation threshold
    """

    def __init__(self, threshold):
        self.threshold = threshold

    def cluster(self, corr_df):
        cells = list(corr_df.index)
        visited = set()
        link_map = {}
        link_id = 1

        for cell in cells:
            if cell in visited:
                continue

            group = [cell]
            visited.add(cell)

            for other in cells:
                if other not in visited:
                    if corr_df.loc[cell, other] >= self.threshold:
                        group.append(other)
                        visited.add(other)

            link_map[f"Link_{link_id}"] = group
            link_id += 1

        return link_map
