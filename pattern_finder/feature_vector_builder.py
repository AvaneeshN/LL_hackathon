import numpy as np


class FeatureVectorBuilder:
    """
    Builds behavioral feature vectors for each cell
    Used as fallback when correlation is weak
    """

    def __init__(self, data_handler):
        self.data_handler = data_handler

    def build(self):
        vectors = {}

        for cell in self.data_handler.get_cells():
            series = np.array(
                self.data_handler.get_loss_series(cell),
                dtype=float
            )

            if len(series) == 0:
                continue

            features = [
                series.mean(),                          # avg stress
                series.max(),                           # peak stress
                np.count_nonzero(series) / len(series),# activity ratio
                series.std(),                           # burstiness
                np.percentile(series, 95)              # tail behavior
            ]

            vectors[cell] = np.array(features)

        return vectors
