import re
from pathlib import Path, PurePosixPath

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
KUBERNETES_DIR = ROOT_DIR / "k8s-repo" / "website"


def build_url(
    english_path: str,
    language: str,
    existing_urls: set[str],
    base_url: str = "https://kubernetes.io",
) -> str | None:
    """Build URL for a given English path based on language and existing paths.

    Args:
    ----
        english_path (str): Path to the English markdown file.
        language (str): Language code (e.g., 'en', 'fr').
        existing_urls (set[str]): Set of existing urls to check against.
        base_url (str): Base URL for the site.

    Returns:
    -------
        str | None: The constructed URL or None if the path is invalid or not found.

    Example:
    -------
        content/en/docs/api/reference.md -> https://kubernetes.io/docs/api/reference/
        content/en/docs/api/reference.md -> https://kubernetes.io/ja/docs/api/reference/
        content/en/blog/_posts/2024-10-02-xxxx.md -> https://kubernetes.io/blog/2024/10/02/xxxx/
        content/en/blog/concepts/_index.md -> https://kubernetes.io/blog/concepts/

    """
    path = PurePosixPath(english_path)
    if not str(path).startswith("content/en/") or path.suffix != ".md":
        return None

    try:
        relative_path = path.relative_to("content/en")
        parts = relative_path.parts
    except ValueError:
        return None

    if len(parts) < 2:
        return None

    # Remove _index files
    if parts[-1] in ("_index.md", "_index.html"):
        parts = parts[:-1]

    lang_prefix = "" if language == "en" else f"{language}/"
    category = parts[0]

    if category == "docs":
        doc_path = "/".join(parts[1:]).removesuffix(".md")
        return f"{base_url}/{lang_prefix}docs/{doc_path}/"

    elif category == "blog":
        return _build_blog_url(
            english_path, parts, existing_urls, lang_prefix, base_url
        )

    # Other categories
    other_path = "/".join(parts).removesuffix(".md")
    return f"{base_url}/{lang_prefix}{other_path}/"


def _build_blog_url(  # noqa: PLR0912, C901
    file_path: str,
    parts: tuple,
    existing_urls: set,
    lang_prefix: str,
    base_url: str,
) -> str | None:
    """Build blog URL with Hugo priority: slug+date > url > filename.

    Args:
    ----
        file_path (str): Path to the markdown file.
        parts (tuple): Parts of the path split by '/'.
        existing_urls (set): Set of existing URLs to check against.
        lang_prefix (str): Language prefix for the URL.
        base_url (str): Base URL for the site.

    Returns:
    -------
        str | None: The URL or None if no valid URL found.

    """
    # Try to get front matter
    front_matter = _parse_front_matter(file_path)

    # Priority 1: slug + date
    if front_matter and "slug" in front_matter and "date" in front_matter:
        slug = front_matter["slug"]
        date_match = re.match(r"(\d{4})-(\d{2})-(\d{2})", front_matter["date"])
        if date_match:
            year, month, day = date_match.groups()
            if day == "00":
                url = f"{base_url}/{lang_prefix}blog/{year}/{month}/{slug}/"
            else:
                url = f"{base_url}/{lang_prefix}blog/{year}/{month}/{day}/{slug}/"
            if url in existing_urls:
                return url

    # Priority 2: explicit url
    if front_matter and "url" in front_matter:
        url = f"{base_url}/{lang_prefix}{front_matter['url'].strip('/')}/"
        if url in existing_urls:
            return url

    # Priority 3: filename
    if len(parts) >= 3 and parts[1] == "_posts":
        filename = Path(parts[2]).stem
        date_match = re.match(r"(\d{4})-(\d{2})-(\d{2})-(.+)", filename)
        if date_match:
            year, month, day, title = date_match.groups()
            if day == "00":
                url = f"{base_url}/{lang_prefix}blog/{year}/{month}/{title}/"
            else:
                url = f"{base_url}/{lang_prefix}blog/{year}/{month}/{day}/{title}/"
        else:
            url = f"{base_url}/{lang_prefix}blog/{filename}/"
        if url in existing_urls:
            return url

    # Blog category
    blog_path = "/".join(parts[1:]).removesuffix(".md")
    url = (
        f"{base_url}/{lang_prefix}blog/{blog_path}/"
        if blog_path
        else f"{base_url}/{lang_prefix}blog/"
    )
    return url if url in existing_urls else None


def _parse_front_matter(file_path: str) -> dict | None:
    """Parse front matter fields: url, slug, date."""
    try:
        content = Path(KUBERNETES_DIR / file_path).read_text(encoding="utf-8")
        match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
        if not match:
            return None

        fm_content = match.group(1)
        result = {}

        for field in ["url", "slug", "date"]:
            field_match = re.search(
                rf'^{field}:\s*["\']?([^"\'\n]+)["\']?\s*$', fm_content, re.MULTILINE
            )
            if field_match:
                result[field] = field_match.group(1).strip()

        return result if result else None
    except (FileNotFoundError, UnicodeDecodeError):
        return None
