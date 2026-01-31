import numpy as np


class LinkCapacityEstimator:
    """
    Estimates Ethernet link capacity
    - Peak mode (no buffer)
    - Safe mode (buffer-aware)
    """

    def __init__(self, buffer_margin=1.25):
        self.buffer_margin = buffer_margin

    def estimate(self, link_map, handler):
        capacity = {}

        for link, cells in link_map.items():
            all_tx = []

            for cell in cells:
                tx_series = handler.get_tx_series(cell)
                if len(tx_series) > 0:
                    all_tx.append(tx_series)

            if not all_tx:
                capacity[link] = {
                    "peak_gbps": 0,
                    "safe_gbps": 0,
                    "buffer_mode": "margin"
                }
                continue

            min_len = min(len(s) for s in all_tx)
            stacked = np.vstack([s[:min_len] for s in all_tx])

            total_tx = stacked.sum(axis=0)

            # Convert packets → Gbps
            bytes_per_packet = 1500
            slot_sec = 0.0005

            gbps = (total_tx * bytes_per_packet * 8) / (slot_sec * 1e9)

            peak = float(np.max(gbps))
            safe = round(peak * self.buffer_margin, 3)

            capacity[link] = {
                "peak_gbps": round(peak, 3),
                "safe_gbps": safe,
                "buffer_mode": "margin"
            }

        return capacity
