# correlation_engine.py

import numpy as np
import pandas as pd


class CorrelationEngine:
    """
    Computes Pearson correlation between cell loss vectors
    """

    def __init__(self, threshold):
        self.threshold = threshold

    def compute_matrix(self, vectors):
        cells = list(vectors.keys())
        n = len(cells)

        mat = np.zeros((n, n))

        for i in range(n):
            for j in range(n):
                x = vectors[cells[i]]
                y = vectors[cells[j]]

                if i == j:
                    mat[i, j] = 1.0
                else:
                    if len(x) > 5 and len(y) > 5:
                        corr = np.corrcoef(x, y)[0, 1]
                        mat[i, j] = 0 if np.isnan(corr) else corr
                    else:
                        mat[i, j] = 0

        return pd.DataFrame(mat, index=cells, columns=cells)
