import json
from datetime import datetime


def export_topology(
    output_path,
    link_map,
    confidences,
    threshold,
    dataset_mode,
    cell_count,
    capacity_map=None,
    traffic_map=None
):
    export_data = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "dataset": dataset_mode,
        "threshold": threshold,
        "cell_count": cell_count,
        "links": []
    }

    for link, cells in link_map.items():
        export_data["links"].append({
            "id": link,
            "cells": cells,
            "confidence": round(confidences.get(link, 0.0), 3),
            "capacity": capacity_map.get(link, {}) if capacity_map else {},
            "traffic_timeseries": (
                traffic_map.get(link, []) if traffic_map else []
            )
        })

    with open(output_path, "w") as f:
        json.dump(export_data, f, indent=2)

    return export_data
