import re
from pathlib import Path

import yaml


class URLBuilder:
    def __init__(
        self,
        existing_urls: set[str],
        base_url: str = "https://kubernetes.io",
    ) -> None:
        """Initialize the URLBuilder with a base URL and a set of existing URLs."""
        self.existing_urls = existing_urls
        self.base_url = base_url
        self._allowed_extensions = {".html", ".md"}

    def build_url(self, english_path: str, lang: str) -> str | None:
        """Build URL for a given English path and language."""
        path = Path(english_path)
        if not path.is_relative_to(Path("content/en")):
            return None

        if path.suffix not in self._allowed_extensions:
            return None

        lang_prefix = lang if lang != "en" else ""
