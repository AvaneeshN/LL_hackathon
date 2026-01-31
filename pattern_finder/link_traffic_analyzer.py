import os
import numpy as np
import matplotlib.pyplot as plt


class LinkTrafficAnalyzer:
    """
    Builds traffic time-series per inferred link and generates
    Figure-3 style plots (Gbps vs Time)
    """

    def __init__(self, slot_duration_sec=0.0005):
        # 1 slot = 500 microseconds (per Nokia doc)
        self.slot_duration_sec = slot_duration_sec

    def build_timeseries(self, link_map, handler):
        """
        Returns:
        {
          "Link_1": [gbps_t0, gbps_t1, ...],
          "Link_2": [...]
        }
        """
        link_series = {}

        for link, cells in link_map.items():
            per_cell_series = []

            for cell in cells:
                tx = handler.get_tx_series(cell)
                if len(tx) > 0:
                    per_cell_series.append(tx)

            if not per_cell_series:
                link_series[link] = []
                continue

            # Align all series to shortest length
            min_len = min(len(s) for s in per_cell_series)
            stacked = np.vstack([s[:min_len] for s in per_cell_series])

            # Aggregate traffic across cells
            total_tx = stacked.sum(axis=0)

            # Convert packets/slot → Gbps
            # Assumption: 1500 bytes per packet
            bytes_per_packet = 1500
            gbps = (
                total_tx * bytes_per_packet * 8
            ) / (self.slot_duration_sec * 1e9)

            link_series[link] = gbps.tolist()

        return link_series

    def plot(self, link, series, output_dir, seconds=60):
        """
        Generates Nokia Figure-3 style plot
        """
        if not series:
            return

        max_points = int(seconds / self.slot_duration_sec)
        y = np.array(series[:max_points])
        x = np.linspace(0, seconds, len(y))

        plt.figure(figsize=(10, 4))
        plt.plot(x, y, linewidth=0.7)
        plt.xlabel("Time (s)")
        plt.ylabel("Data rate (Gbps)")
        plt.title(f"Required FH Link Capacity — {link}")
        plt.grid(alpha=0.3)

        out_path = os.path.join(output_dir, f"traffic_{link}.png")
        plt.tight_layout()
        plt.savefig(out_path)
        plt.close()
