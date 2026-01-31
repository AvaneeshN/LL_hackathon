# api.py

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

app = FastAPI(title="Nokia Fronthaul Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LAST_RESULT = None


def run_engine(dataset_mode="raw"):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if dataset_mode == "processed":
        handler = CleanedCSVFolderHandler(PROCESSED_DATA_PATH)
    else:
        handler = RawFileDataHandler(DATA_PATH)

    cells = handler.get_cells()
    cell_count = len(cells)

    if cell_count < 2:
        return {
            "error": "Not enough cells for topology inference",
            "cell_count": cell_count
        }

    vectors = LossVectorBuilder(handler).build()
    corr_df = CorrelationEngine(CORRELATION_THRESHOLD).compute_matrix(vectors)
    link_map = ClusteringEngine(CORRELATION_THRESHOLD).cluster(corr_df)

    confidences = compute_confidence(link_map, corr_df)

    export_path = os.path.join(OUTPUT_DIR, "topology.json")

    return export_topology(
        export_path,
        link_map,
        confidences,
        CORRELATION_THRESHOLD,
        dataset_mode,
        cell_count
    )


@app.get("/")
def root():
    return {"service": "Nokia Fronthaul Intelligence API", "status": "running"}


@app.get("/run")
def run(dataset: str = "raw"):
    global LAST_RESULT
    LAST_RESULT = run_engine(dataset)
    return LAST_RESULT


@app.get("/topology")
def topology():
    global LAST_RESULT
    return LAST_RESULT or {"error": "Run /run first"}


@app.get("/metadata")
def metadata():
    return {
        "threshold": CORRELATION_THRESHOLD,
        "raw_data_path": DATA_PATH,
        "processed_data_path": PROCESSED_DATA_PATH
    }
