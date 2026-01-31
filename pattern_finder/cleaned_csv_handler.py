# cleaned_csv_handler.py

import os
import numpy as np
import pandas as pd
from interfaces import DataHandler

class CleanedCSVFolderHandler(DataHandler):
    """
    Reads folder of processed CSV files.
    Each file = one cell.
    Must contain column: loss_flag (0 or 1)

    Example filenames:
    cell_cleaned_pkt_stats_13.csv
    cell_5.csv
    processed_7.csv
    """

    def __init__(self, folder_path):
        self.folder_path = folder_path
        self.file_map = {}

        for fname in os.listdir(folder_path):
            if not fname.lower().endswith(".csv"):
                continue

            # Extract last number in filename as cell_id
            base = fname.replace(".csv", "")
            cell_id = base.split("_")[-1]

            self.file_map[cell_id] = os.path.join(folder_path, fname)

        if not self.file_map:
            raise ValueError("No CSV files found in processed folder")

        self.cells = sorted(self.file_map.keys(), key=lambda x: int(x))

    def get_cells(self):
        return self.cells

    def get_loss_series(self, cell_id):
        path = self.file_map.get(str(cell_id))

        if not path:
            raise FileNotFoundError(f"No CSV mapped for cell {cell_id}")

        df = pd.read_csv(path)
        df.columns = [c.lower().strip() for c in df.columns]

        if "loss_flag" not in df.columns:
            raise ValueError(f"{os.path.basename(path)} must contain loss_flag column")

        return np.array(df["loss_flag"].astype(int).tolist())
