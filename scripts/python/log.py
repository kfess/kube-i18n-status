import logging
import time


def _jst_converter(timestamp: int) -> time.struct_time:
    """Convert a timestamp to Japan Standard Time (JST).

    Args:
    ----
        timestamp (int): The timestamp to convert.

    Returns:
    -------
        time.struct_time: The converted time in JST.

    """
    return time.localtime(timestamp + 9 * 3600)


logging.Formatter.converter = _jst_converter
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s JST - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)
