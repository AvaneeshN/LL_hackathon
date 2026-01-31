# cleaned_csv_handler.py

import os
import numpy as np
import pandas as pd
from interfaces import DataHandler

class CleanedCSVFolderHandler(DataHandler):
    """
    Reads a folder of processed CSV files.
    Each file represents ONE cell and must contain:
    - loss_flag column
    Cell ID is extracted from the filename automatically.
    """

    def __init__(self, folder_path):
        self.folder_path = folder_path

        self.file_map = {}  # cell_id -> filepath

        for fname in os.listdir(folder_path):
            if not fname.lower().endswith(".csv"):
                continue

            # Extract last number from filename as cell ID
            parts = fname.split("_")
            cell_id = parts[-1].replace(".csv", "")

            self.file_map[cell_id] = os.path.join(folder_path, fname)

        if not self.file_map:
            raise ValueError("No CSV files found in processed data folder")

        self.cells = sorted(self.file_map.keys(), key=lambda x: int(x))

    def get_cells(self):
        return self.cells

    def get_loss_series(self, cell_id):
        path = self.file_map.get(str(cell_id))

        if not path:
            raise FileNotFoundError(f"No CSV file mapped for cell {cell_id}")

        df = pd.read_csv(path)
        df.columns = [c.lower().strip() for c in df.columns]

        if "loss_flag" not in df.columns:
            raise ValueError(f"{os.path.basename(path)} must contain loss_flag column")

        return np.array(df["loss_flag"].astype(int).tolist())
