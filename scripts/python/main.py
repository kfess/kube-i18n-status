import json
import logging
import re
from pathlib import Path

from exporter import process_translation_results
from history import GitFileHistoryTracker
from models import GitCommitDict
from translation_status import TranslationStatusTracker

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
INPUT_FILE = ROOT_DIR / "data" / "master" / "git_history.jsonl"
OUTPUT_DIR = ROOT_DIR / "data" / "output"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


def sanitize(line: str) -> str:
    """Sanitize a string by replacing backslashes with double backslashes.

    Args:
    ----
        line (str): The input string to sanitize.

    Returns:
    -------
        str: The sanitized string with backslashes replaced.

    """
    return re.compile(r'\\(?![\\bfnrt"/])').sub(r"\\\\", line)


def load_json_records(filepath: Path | str) -> list[GitCommitDict]:
    """Load JSON records from a file, handling potential formatting issues.

    Args:
    ----
        filepath (Path | str): The path to the JSONL file.

    Returns:
    -------
        list[dict[str, Any]]: A list of JSON objects loaded from the file.

    Raises:
    ------
        FileNotFoundError: If the file doesn't exist.

    """
    records: list[GitCommitDict] = []
    path = Path(filepath)

    if not path.exists():
        msg = f"File not found: {path}"
        raise FileNotFoundError(msg)

    logger.info("Start Loading JSON records from: %s", path)

    with path.open(encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            original = line.strip()
            if not original:
                continue
            try:
                obj = json.loads(original)
            except json.JSONDecodeError:
                fixed = sanitize(original)
                try:
                    logger.warning(
                        "Fixed line %d - Original: %s => Fixed: %s",
                        line_no,
                        original,
                        fixed,
                    )
                    obj = json.loads(fixed)
                except json.JSONDecodeError:
                    logger.exception("Failed to decode line %d", line_no)
                    continue

            records.append(obj)

    logger.info("Successfully loaded %d records from %s", len(records), INPUT_FILE)
    return records


def load_existing_paths() -> set[str]:
    """Load existing file paths from text files.

    Returns
    -------
        set[str]: A set of existing file paths from the JSONL file.

    """
    target_file = ROOT_DIR / "data" / "master" / "all_files.csv"
    with Path.open(target_file, "r", encoding="utf-8") as f:
        return {line.strip() for line in f if line.strip()}


def main() -> None:
    """Load JSONL file and save translation results to output directory."""
    try:
        records = load_json_records(INPUT_FILE)
    except FileNotFoundError:
        logger.exception("File not found: %s")
        return []
    except Exception:
        logger.exception("An unexpected error occurred: %s")
        return []

    existing_paths = load_existing_paths()
    file_history_tracker = GitFileHistoryTracker(
        commits=records, current_files=existing_paths
    )
    translation_tracker = TranslationStatusTracker(
        file_history_tracker=file_history_tracker,
        existing_paths=existing_paths,
    )
    status_result = translation_tracker.analyze()
    process_translation_results(status_result, output_dir=OUTPUT_DIR)

    return None


if __name__ == "__main__":
    main()
