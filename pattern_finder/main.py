import os
import numpy as np

from config import DATA_PATH, PROCESSED_DATA_PATH, CORRELATION_THRESHOLD, OUTPUT_DIR

from data_handler import RawFileDataHandler
from cleaned_csv_handler import CleanedCSVFolderHandler
from loss_vector_builder import LossVectorBuilder
from correlation_engine import CorrelationEngine
from clustering_engine import ClusteringEngine
from confidence import compute_confidence
from visualization import Visualizer
from exporter import export_topology
from capacity_estimator import LinkCapacityEstimator
from link_traffic_analyzer import LinkTrafficAnalyzer


# ===============================
# CONFIG
# ===============================
DATA_MODE = "raw"  # switch to "processed" later


def main():
    print("📡 Nokia Fronthaul Pattern Finder\n")
    print("🔧 Mode:", DATA_MODE.upper())
    print("🎚️ Correlation Threshold:", CORRELATION_THRESHOLD, "\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # -------------------------------
    # Load dataset
    # -------------------------------
    if DATA_MODE == "processed":
        handler = CleanedCSVFolderHandler(PROCESSED_DATA_PATH)
        dataset_label = "processed"
    else:
        handler = RawFileDataHandler(DATA_PATH)
        dataset_label = "raw"

    # -------------------------------
    # Discover cells
    # -------------------------------
    cells = handler.get_cells()
    print(f"Found {len(cells)} cells")

    if len(cells) < 2:
        print("⚠️ Not enough cells for topology inference")
        return

    # -------------------------------
    # Build behavior fingerprints
    # -------------------------------
    print("🧠 Building behavior fingerprints...")
    vectors = LossVectorBuilder(handler).build()
    np.save(os.path.join(OUTPUT_DIR, "loss_vectors.npy"), vectors)

    # -------------------------------
    # Correlation matrix
    # -------------------------------
    print("📊 Computing correlation matrix...")
    corr_engine = CorrelationEngine(CORRELATION_THRESHOLD)
    corr_df = corr_engine.compute_matrix(vectors)
    corr_df.to_csv(os.path.join(OUTPUT_DIR, "corr_matrix.csv"))

    # -------------------------------
    # Topology inference
    # -------------------------------
    print("🕸️ Inferring topology...")
    cluster_engine = ClusteringEngine(CORRELATION_THRESHOLD)
    link_map = cluster_engine.cluster(corr_df)

    # -------------------------------
    # Confidence scoring
    # -------------------------------
    print("📐 Computing confidence scores...")
    confidences = compute_confidence(link_map, corr_df)

    # -------------------------------
    # Capacity estimation
    # -------------------------------
    print("📡 Estimating Ethernet link capacity (dual mode)...")
    capacity_engine = LinkCapacityEstimator()
    capacity_map = capacity_engine.estimate(link_map, handler)

    # -------------------------------
    # Traffic time-series
    # -------------------------------
    print("📈 Generating link traffic time-series...")
    traffic_engine = LinkTrafficAnalyzer()
    traffic_map = traffic_engine.build_timeseries(link_map, handler)

    for link, series in traffic_map.items():
        traffic_engine.plot(link, series, OUTPUT_DIR)

    # -------------------------------
    # Visualization
    # -------------------------------
    viz = Visualizer()

    print("🎨 Generating heatmap...")
    viz.save_heatmap(
        corr_df,
        os.path.join(OUTPUT_DIR, "heatmap.png")
    )

    print("🕸️ Generating topology graph...")
    viz.save_topology_graph(
        link_map,
        confidences,
        os.path.join(OUTPUT_DIR, "topology_graph.png")
    )

    # -------------------------------
    # Export for frontend / ML
    # -------------------------------
    print("💾 Exporting topology JSON...")
    export_topology(
        os.path.join(OUTPUT_DIR, "topology.json"),
        link_map,
        confidences,
        CORRELATION_THRESHOLD,
        dataset_label,
        len(cells),
        capacity_map,
        traffic_map
    )

    # -------------------------------
    # Console summary
    # -------------------------------
    print("\n🏁 DONE — Network Topology Discovered\n")

    for link, group in link_map.items():
        conf = confidences.get(link, 0.0)
        cap = capacity_map.get(link, {})
        print(
            f"{link}: {group} | "
            f"confidence={conf:.2f} | "
            f"peak={cap.get('peak_gbps', 0)} Gbps | "
            f"safe_capacity={cap.get('safe_gbps', 0)} Gbps"
        )

    print(f"\n🧾 Frontend JSON saved to: {OUTPUT_DIR}/topology.json")
    print(f"📊 Heatmap saved to: {OUTPUT_DIR}/heatmap.png")
    print(f"🕸️ Topology graph saved to: {OUTPUT_DIR}/topology_graph.png")
    print(f"📈 Traffic plots saved to: {OUTPUT_DIR}/traffic_Link_X.png")


if __name__ == "__main__":
    main()
