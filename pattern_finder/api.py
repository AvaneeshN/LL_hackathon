import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from capacity_estimator import LinkCapacityEstimator
from link_traffic_analyzer import LinkTrafficAnalyzer

# ----------------------------
# APP
# ----------------------------
app = FastAPI(title="Nokia Fronthaul Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LAST_RESULT = None

# ----------------------------
# ENGINE
# ----------------------------
def run_engine(dataset_mode="raw"):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if dataset_mode == "processed":
        handler = CleanedCSVFolderHandler(PROCESSED_DATA_PATH)
        dataset_label = "processed"
    else:
        handler = RawFileDataHandler(DATA_PATH)
        dataset_label = "raw"

    cells = handler.get_cells()
    cell_count = len(cells)

    if cell_count < 1:
        return {
            "links": [],
            "cells": [],
            "error": "No cells found",
            "cell_count": cell_count
        }

    # ----------------------------
    # Fingerprints
    # ----------------------------
    vectors = LossVectorBuilder(handler).build()

    # ----------------------------
    # Correlation
    # ----------------------------
    corr_df = CorrelationEngine(CORRELATION_THRESHOLD).compute_matrix(vectors)

    # ----------------------------
    # Topology
    # ----------------------------
    link_map = ClusteringEngine(CORRELATION_THRESHOLD).cluster(corr_df)

    # ----------------------------
    # Confidence
    # ----------------------------
    confidences = compute_confidence(link_map, corr_df)

    # ----------------------------
    # Capacity
    # ----------------------------
    capacity_engine = LinkCapacityEstimator()
    capacity_map = capacity_engine.estimate(link_map, handler)

    # ----------------------------
    # Traffic Timeseries
    # ----------------------------
    traffic_engine = LinkTrafficAnalyzer()
    traffic_map = traffic_engine.build_timeseries(link_map, handler)

    # ----------------------------
    # Export
    # ----------------------------
    export_path = os.path.join(OUTPUT_DIR, "topology.json")

    return export_topology(
        export_path,
        link_map,
        confidences,
        CORRELATION_THRESHOLD,
        dataset_label,
        cell_count,
        capacity_map,
        traffic_map
    )

# ----------------------------
# ROUTES
# ----------------------------
@app.get("/")
def root():
    return {
        "service": "Nokia Fronthaul Intelligence API",
        "status": "running"
    }

@app.get("/api/run")
def run(dataset: str = "raw"):
    global LAST_RESULT
    LAST_RESULT = run_engine(dataset)
    return LAST_RESULT

@app.get("/api/topology")
def topology():
    global LAST_RESULT

    if LAST_RESULT is None:
        LAST_RESULT = run_engine("raw")

    return LAST_RESULT

@app.get("/api/metadata")
def metadata():
    return {
        "threshold": CORRELATION_THRESHOLD,
        "raw_data_path": DATA_PATH,
        "processed_data_path": PROCESSED_DATA_PATH
    }


