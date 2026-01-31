# correlation_engine.py

import numpy as np
import pandas as pd

class CorrelationEngine:
    """
    Computes correlation matrix for all cell loss vectors
    """

    def __init__(self, threshold=0.7):
        self.threshold = threshold

    def compute_matrix(self, vectors):
        cells = list(vectors.keys())
        n = len(cells)

        matrix = np.zeros((n, n))

        for i in range(n):
            for j in range(n):
                a = vectors[cells[i]]
                b = vectors[cells[j]]

                min_len = min(len(a), len(b))
                if min_len < 5:
                    matrix[i][j] = 0
                else:
                    try:
                        matrix[i][j] = float(
                            np.corrcoef(a[:min_len], b[:min_len])[0, 1]
                        )
                    except:
                        matrix[i][j] = 0

        return pd.DataFrame(matrix, index=cells, columns=cells)
