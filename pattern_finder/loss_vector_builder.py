# loss_vector_builder.py

class LossVectorBuilder:
    """
    Builds behavior fingerprints for each cell
    """

    def __init__(self, data_handler):
        self.data_handler = data_handler

    def build(self):
        vectors = {}
        for cell in self.data_handler.get_cells():
            vectors[cell] = self.data_handler.get_loss_series(cell)
        return vectors
