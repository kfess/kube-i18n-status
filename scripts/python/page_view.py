import csv
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


@dataclass
class PageView:
    """Dataclass to represent a page view."""

    views: int
    new_users: int


def build_url(
    path: str,
    existing_urls: set[str],
    base_url: str = "https://kubernetes.io",
) -> str | None:
    """Build URL from page view path.

    Args:
    ----
        path (str): The page view path to build the URL from.
        existing_urls (set[str]): Set of existing URLs to check against.
        base_url (str): Base URL for the site.

    Returns:
    -------
        str | None: The constructed URL or None if the path is invalid or not found.

    """
    path = f"{base_url}{path}"

    if path not in existing_urls:
        return None

    return path


def summarize_view(csv_file: str, existing_urls: set[str]) -> dict[str, PageView]:
    """Summarize page view data from a CSV file.

    Args:
    ----
        csv_file (str): Path to the CSV file containing page view data.
        existing_urls (set[str]): Set of existing URLs to check against.

    Returns:
    -------
        dict[str, PageView]: A dictionary summarizing the page view data.

    """
    data = defaultdict(lambda: PageView(views=0, new_users=0))

    with Path(csv_file).open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            path = row["Page path"]

            view = int(row["Views"])
            new_users = int(row["New users"])

            url = build_url(path, existing_urls)

            if not url:
                continue

            data[url].views += view
            data[url].new_users += new_users

    return data
