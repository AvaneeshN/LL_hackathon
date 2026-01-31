# confidence.py

def compute_confidence(link_map, corr_df):
    """
    Computes average correlation inside each link
    """

    confidences = {}

    for link, cells in link_map.items():
        if len(cells) < 2:
            confidences[link] = 0.0
            continue

        scores = []
        for i in range(len(cells)):
            for j in range(i + 1, len(cells)):
                try:
                    scores.append(float(corr_df.loc[cells[i], cells[j]]))
                except:
                    pass

        confidences[link] = round(sum(scores) / len(scores), 3) if scores else 0.0

    return confidences
