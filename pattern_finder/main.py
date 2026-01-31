# main.py

import os
import numpy as np

from config import (
    DATA_PATH,
    PROCESSED_DATA_PATH,
    CORRELATION_THRESHOLD,
    OUTPUT_DIR
)

from data_handler import RawFileDataHandler
from cleaned_csv_handler import CleanedCSVFolderHandler
from loss_vector_builder import LossVectorBuilder
from correlation_engine import CorrelationEngine
from clustering_engine import ClusteringEngine
from confidence import compute_confidence
from exporter import export_topology
from validator import LinkValidator
from visualization import Visualizer


def main(dataset_mode="raw"):
    print("📡 Nokia Fronthaul Pattern Finder Starting...\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Choose data source
    if dataset_mode == "processed":
        handler = CleanedCSVFolderHandler(PROCESSED_DATA_PATH)
    else:
        handler = RawFileDataHandler(DATA_PATH)

    cells = handler.get_cells()
    print(f"Found {len(cells)} cells")

    if len(cells) < 2:
        print("⚠️ Not enough cells for topology inference")
        return

    # Build loss vectors
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

    # Confidence
    print("📐 Computing confidence scores...")
    confidences = compute_confidence(link_map, corr_df)

    # Validation
    print("✅ Validating results...")
    issues = LinkValidator().validate(link_map)

    # Visualization
    print("🎨 Generating heatmap...")
    Visualizer().save_heatmap(corr_df, f"{OUTPUT_DIR}/heatmap.png")

    # Export
    print("💾 Exporting topology...")
    export_topology(
        f"{OUTPUT_DIR}/topology.json",
        link_map,
        confidences,
        CORRELATION_THRESHOLD,
        dataset_mode,
        len(cells)
    )

    print("\n🏁 DONE — Network Topology Discovered\n")
    for link, cells in link_map.items():
        print(f"{link}: {cells}")

    if issues:
        print("\n⚠️ Warnings:")
        for issue in issues:
            print("-", issue)


if __name__ == "__main__":
    main()
