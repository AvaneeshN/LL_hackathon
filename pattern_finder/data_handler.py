# data_handler.py

import os
import numpy as np
from interfaces import DataHandler


class RawFileDataHandler(DataHandler):
    """
    Reads pkt-stats-cell-X.dat files
    Converts them into binary packet loss vectors
    """

    def __init__(self, data_dir):
        self.data_dir = data_dir
        self.cells = self._scan_cells()

    def _scan_cells(self):
        cells = []
        for fname in os.listdir(self.data_dir):
            if fname.startswith("pkt-stats-cell") and fname.endswith(".dat"):
                cell_id = fname.split("-")[-1].replace(".dat", "")
                cells.append(cell_id)
        return sorted(cells, key=lambda x: int(x))

    def get_cells(self):
        return self.cells

    def get_loss_series(self, cell_id):
        path = os.path.join(self.data_dir, f"pkt-stats-cell-{cell_id}.dat")

        loss_series = []
        with open(path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 4:
                    continue

                try:
                    tx = int(parts[1])
                    rx = int(parts[2])
                    late = int(parts[3])
                except ValueError:
                    continue

                loss = max(0, tx - rx + late)
                loss_series.append(1 if loss > 0 else 0)

        return np.array(loss_series, dtype=float)
