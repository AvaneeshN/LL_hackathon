# interfaces.py

from abc import ABC, abstractmethod

class DataHandler(ABC):
    """
    Contract for all data sources.
    Raw files, cleaned CSVs, databases, or APIs
    must implement these two methods.
    """

    @abstractmethod
    def get_cells(self):
        """Return list of cell IDs"""
        pass

    @abstractmethod
    def get_loss_series(self, cell_id):
        """
        Return time-aligned binary loss series.
        Example: [0, 1, 0, 0, 1]
        """
        pass

