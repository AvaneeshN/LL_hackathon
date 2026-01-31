# exporter.py

# exporter.py

import json
from datetime import datetime

def export_topology(
    output_path,
    link_map,
    confidences,
    threshold,
    dataset_mode,
    cell_count
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
            "confidence": confidences.get(link, 0.0)
        })

    with open(output_path, "w") as f:
        json.dump(export_data, f, indent=2)

    return export_data
