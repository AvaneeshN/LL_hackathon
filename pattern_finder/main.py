# main.py

import os
import numpy as np

from config import DATA_PATH, CORRELATION_THRESHOLD, OUTPUT_DIR
from data_handler import RawFileDataHandler
from loss_vector_builder import LossVectorBuilder
from correlation_engine import CorrelationEngine
from clustering_engine import ClusteringEngine
from visualization import Visualizer


def main():
    print("📡 Nokia Fronthaul Pattern Finder (Baseline)\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    handler = RawFileDataHandler(DATA_PATH)

    cells = handler.get_cells()
    print(f"Found {len(cells)} cells")

    if len(cells) < 2:
        print("⚠️ Not enough cells")
        return

    # Build vectors
    print("🧠 Building behavior fingerprints...")
    vectors = LossVectorBuilder(handler).build()

    np.save(f"{OUTPUT_DIR}/loss_vectors.npy", vectors)

    # Correlation
    print("📊 Computing correlation matrix...")
    corr_df = CorrelationEngine(CORRELATION_THRESHOLD).compute_matrix(vectors)
    corr_df.to_csv(f"{OUTPUT_DIR}/corr_matrix.csv")

    # Clustering
    print("🕸️ Inferring topology...")
    link_map = ClusteringEngine(CORRELATION_THRESHOLD).cluster(corr_df)

    # Visualization
    viz = Visualizer()
    print("🎨 Generating heatmap...")
    viz.save_heatmap(corr_df, f"{OUTPUT_DIR}/heatmap.png")

    print("🕸️ Generating topology graph...")
    viz.save_topology_graph(link_map, {}, f"{OUTPUT_DIR}/topology_graph.png")

    # Output
    print("\n🏁 DONE — Network Topology Discovered\n")
    for link, group in link_map.items():
        print(f"{link}: {group}")


if __name__ == "__main__":
    main()
