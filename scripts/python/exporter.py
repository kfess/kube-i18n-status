import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any

from translation_status import TranslationStatusResult
from utils import convert_keys_to_camel_case, serialize_datetime


def should_process(result: TranslationStatusResult) -> bool:
    """Determine if a translation result should be processed.

    Args:
    ----
        result (TranslationStatusResult): The translation status result to check.

    Returns:
    -------
        bool: True if the result should be processed, False otherwise.

    """

    def is_supported_extension(path: PurePosixPath) -> bool:
        return path.suffix in {".md", ".html"}

    def is_known_category(category: str) -> bool:
        return category != "unknown"

    path = PurePosixPath(result["english_path"].lower())

    return is_supported_extension(path) and is_known_category(result["category"])


def extract_blog_date_from_en_path(en_path: str) -> str:
    """Extract date from blog post path.

    Args:
    ----
        en_path (str): The English file path.

    Returns:
    -------
        str: The extracted date in YYYY-MM-DD format.

    Example:
    -------
        content/en/blog/_posts/2024-10-02-xxxx.md -> 2024-10-02
        content/ja/blog/_posts/2025-03-26.md -> 2025-03-26

    """
    match = re.search(r"content/en/blog/_posts/(\d{4}-\d{2}-\d{2})", en_path)
    return match.group(1) if match else "0000-00-00"


def create_matrix_data(
    results: dict[str, dict[str, TranslationStatusResult]],
) -> dict[str, dict[str, Any]]:
    """Create matrix data grouped by category."""
    matrix_data = defaultdict(
        lambda: {
            "last_updated": datetime.now(tz=timezone.utc).isoformat(),  # noqa: UP017
            "articles": [],
        }
    )

    articles_by_english_path = defaultdict(dict)

    for result in results.values():
        english_path = result["english_path"]
        language = result["language"]
        translation_data = {
            "status": result["status"],
            "severity": result["severity"],
            "days_behind": result["days_behind"],
            "commits_behind": result["commits_behind"],
            "total_change_lines": result["total_change_lines"],
            "target_latest_date": result["target_latest_date"],
            "english_latest_date": result["english_latest_date"],
        }

        articles_by_english_path[english_path][language] = translation_data

    for english_path, translations in articles_by_english_path.items():
        category = next(
            result["category"]
            for result in results.values()
            if result["english_path"] == english_path
        )

        article_data = {"english_path": english_path, "translations": translations}
        matrix_data[category]["articles"].append(article_data)

    # Sort blog articles by date
    for category, data in matrix_data.items():
        if category == "blog":
            data["articles"].sort(
                key=lambda x: extract_blog_date_from_en_path(x["english_path"]),
                reverse=True,
            )

    return dict(matrix_data)


def create_detail_data(result: dict[str, TranslationStatusResult]) -> dict[str, Any]:
    """Create detail data for a single translation result."""
    return {
        "target_path": result["target_path"],
        "english_path": result["english_path"],
        "target_latest_date": result["target_latest_date"],
        "english_latest_date": result["english_latest_date"],
        "days_behind": result["days_behind"],
        "commits_behind": result["commits_behind"],
        "total_change_lines": result["total_change_lines"],
        "insertions_behind_lines": result["insertions_behind_lines"],
        "deletions_behind_lines": result["deletions_behind_lines"],
        "status": result["status"],
        "severity": result["severity"],
        "missing_commits": result["missing_commits"],
    }


def save_matrix_files(
    matrix_data: dict[str, dict[str, Any]], output_dir: str = "data"
) -> None:
    """Save matrix data to category-specific JSON files."""
    matrix_dir = Path(output_dir) / "matrix"
    matrix_dir.mkdir(parents=True, exist_ok=True)

    for category, data in matrix_data.items():
        file_path = matrix_dir / f"{category}.json"
        with file_path.open("w", encoding="utf-8") as f:
            json.dump(
                convert_keys_to_camel_case(data),
                f,
                indent=2,
                default=serialize_datetime,
            )


def save_detail_files(
    results: dict[str, TranslationStatusResult], output_dir: str = "data"
) -> None:
    """Save detail data grouped by language and category.

    Args:
    ----
        results (dict[str, TranslationStatusResult]): The translation status results.
        output_dir (str): The directory where detail files will be saved.

    Returns:
    -------
        None: The function saves JSON files to the specified output directory.

    """
    details_dir = Path(output_dir) / "details"
    details_dir.mkdir(parents=True, exist_ok=True)

    details_by_language_category = defaultdict(lambda: defaultdict(dict))

    for result in results.values():
        language = result["language"]
        english_path = result["english_path"]
        category = result["category"]
        detail_data = create_detail_data(result)
        details_by_language_category[language][category][english_path] = detail_data

    for language, categories in details_by_language_category.items():
        lang_dir = details_dir / language
        lang_dir.mkdir(exist_ok=True)

        for category, details in categories.items():
            file_path = lang_dir / f"{category}.json"
            with file_path.open("w", encoding="utf-8") as f:
                json.dump(
                    convert_keys_to_camel_case(details),
                    f,
                    indent=2,
                    default=serialize_datetime,
                )


def process_translation_results(
    results: dict[str, TranslationStatusResult], output_dir: str = "data"
) -> None:
    """Process translation results and save them to JSON files.

    Args:
    ----
        results (dict[str, TranslationStatusResult]): The translation status results.
        output_dir (str): The directory where output files will be saved.

    Returns:
    -------
        None: The function saves JSON files to the specified output directory.

    """
    filtered_results = {
        target_path: result
        for target_path, result in results.items()
        if should_process(result)
    }

    # Create matrix data from results
    matrix_data = create_matrix_data(filtered_results)
    save_matrix_files(matrix_data, output_dir)

    # Save detailed translation results
    save_detail_files(filtered_results, output_dir)
