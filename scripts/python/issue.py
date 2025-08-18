import os
import re
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path

from dotenv import load_dotenv
from github import Auth, Github


def load_existing_paths() -> set[str]:
    """Load existing file paths from text files.

    Returns
    -------
        set[str]: A set of existing file paths from the JSONL file.

    """
    root_dir = Path(__file__).resolve().parent.parent.parent
    target_file = root_dir / "data" / "master" / "all_files.csv"
    with Path.open(target_file, "r", encoding="utf-8") as f:
        return {line.strip() for line in f if line.strip()}


LANGUAGE_LABELS = [
    "language/en",
    "language/ko",
    "language/no",
    "language/ja",
    "language/zh",
    "language/pt",
    "language/es",
    "language/hi",
    "language/id",
    "language/de",
    "language/fr",
    "language/it",
    "language/vi",
    "language/ru",
    "language/uk",
    "language/pl",
    "language/fa",
    "language/bn",
    # "language/ar", # for now, Arabic is not supported
]

LANGUAGE_ABBR_IN_TITLE = [
    "en",
    "ko",
    "no",
    "ja",
    "zh",
    "pt-br",
    "es",
    "hi",
    "id",
    "de",
    "fr",
    "it",
    "vi",
    "ru",
    "uk",
    "pl",
    "fa",
    "bn",
    # "ar", # for now, Arabic is not supported
]


@dataclass
class GitHubIssue:
    """Represents a GitHub issue."""

    number: int
    title: str
    url: str
    labels: list[str]


def _get_issues(repo_name: str = "kubernetes/website") -> list[GitHubIssue]:
    """Fetch open issues for a GitHub repository."""
    load_dotenv()

    auth = Auth.Token(os.getenv("KUBERNETES_WEBSITE_READ_GITHUB_TOKEN"))
    g = Github(auth=auth)
    query = f"repo:{repo_name} is:issue is:open"
    raw_issues = g.search_issues(query=query, sort="created", order="desc")

    issues = [
        GitHubIssue(
            number=issue.number,
            title=issue.title,
            url=issue.html_url,
            labels=[label.name for label in issue.labels],
        )
        for issue in raw_issues
    ]

    g.close()

    return issues


def guess_language(issue: GitHubIssue) -> str | None:
    """Guess the language and path for a GitHub issue."""
    guessed_lang = None
    for label in LANGUAGE_LABELS:
        if label in issue.labels:
            guessed_lang = label.split("/")[-1]
            if guessed_lang == "pt":
                guessed_lang = "pt-br"
            elif guessed_lang == "zh":
                guessed_lang = "zh-cn"
            break

    if not guessed_lang:
        lang_pattern_in_title = re.compile(r"^\[([^\]]+)\]")
        match = lang_pattern_in_title.match(issue.title.strip())
        maybe_lang = match.group(1).lower().strip() if match else ""
        if maybe_lang in LANGUAGE_ABBR_IN_TITLE:
            if maybe_lang == "pt":
                guessed_lang = "pt-br"
            if maybe_lang == "zh":
                guessed_lang = "zh-cn"
            guessed_lang = maybe_lang

    return guessed_lang


def extract_path_like_string(title: str) -> str | None:
    """Extract a path-like string from the issue title."""
    patterns = [
        r"/[a-zA-Z0-9/_.-]+",  # start with slash
        r"[a-zA-Z0-9/_.-]+/[a-zA-Z0-9/_.-]+",  # include slash
        r"[a-zA-Z0-9/_.-]+\.(?:md|html)",  # .md or .html file
    ]

    longest_match = None
    for pattern in patterns:
        match = re.search(pattern, title)
        if match:
            found = match.group(0)
            if longest_match is None or len(found) > len(longest_match):
                found = found.removeprefix("/")
                longest_match = found

    return longest_match


def gen_path_candidates(path: str, language: str) -> list[str]:
    """Generate a list of paths candidates based on the given path and language."""
    path = path.strip().lower()

    # 言語を置換する
    language_pattern = (
        r"\b(" + "|".join(re.escape(lang) for lang in LANGUAGE_ABBR_IN_TITLE) + r")\b"
    )
    path = re.sub(language_pattern, language, path)

    if path.startswith("k8s.io/"):
        path = path.lstrip("k8s.io/")

    hyphenated_parts = []
    for part in path.split("/"):
        if not part:
            continue
        if part.startswith("_"):
            hyphenated_parts.append(part)
        else:
            hyphenated_parts.append(part.replace("_", "-"))
    hyphenated_path = "/".join(hyphenated_parts)

    common_path_prefixes = [
        "",
        "content/",
        f"content/{language}/",
        f"content/{language}/docs/",
        f"content/{language}/docs/concepts/",
        f"content/{language}/docs/contribute/",
        f"content/{language}/docs/doc-contributor-tools/",
        f"content/{language}/docs/home/",
        f"content/{language}/docs/images/",
        f"content/{language}/docs/reference/",
        f"content/{language}/docs/setup/",
        f"content/{language}/docs/tasks/",
        f"content/{language}/docs/tutorials/",
        f"content/{language}/blog/",
        f"content/{language}/blog/_posts/",
        f"content/{language}/careers/",
        f"content/{language}/case-studies/",
        f"content/{language}/community/",
        f"content/{language}/examples/",
        f"content/{language}/includes/",
        f"content/{language}/partners/",
        f"content/{language}/releases/",
        f"content/{language}/training/",
    ]

    candidates = set()

    # prefix + path
    for prefix in common_path_prefixes:
        base = str(Path(prefix).joinpath(path))
        candidates.add(base)
        if not base.endswith((".md", ".html")):
            candidates.add(base + ".md")
            candidates.add(base + "/index.md")
            candidates.add(base + "/_index.md")
            candidates.add(base + ".html")
            candidates.add(base + "/index.html")
            candidates.add(base + "/_index.html")

        base2 = str(Path(prefix).joinpath(hyphenated_path))
        candidates.add(base2)
        if not base2.endswith((".md", ".html")):
            candidates.add(base2 + ".md")
            candidates.add(base2 + "/index.md")
            candidates.add(base2 + "/_index.md")
            candidates.add(base2 + ".html")
            candidates.add(base2 + "/index.html")
            candidates.add(base2 + "/_index.html")

    # shorten path
    parts = path.split("/")
    for i in range(1, len(parts)):
        base = "/".join(parts[i:])
        candidates.add(base)
        if not base.endswith((".md", ".html")):
            candidates.add(base + ".md")
            candidates.add(base + "/index.md")
            candidates.add(base + "/_index.md")
            candidates.add(base + ".html")
            candidates.add(base + "/index.html")
            candidates.add(base + "/_index.html")

    parts2 = hyphenated_path.split("/")
    for i in range(1, len(parts2)):
        base = "/".join(parts2[i:])
        candidates.add(base)
        if not base.endswith((".md", ".html")):
            candidates.add(base + ".md")
            candidates.add(base + "/index.md")
            candidates.add(base + "/_index.md")
            candidates.add(base + ".html")
            candidates.add(base + "/index.html")
            candidates.add(base + "/_index.html")

    return list(candidates)


def guess_path(issue: GitHubIssue, language: str) -> str | None:
    """Guess the path for a GitHub issue."""
    path_like_string = extract_path_like_string(issue.title)
    all_paths = {
        path.replace("content/en/", f"content/{lang}/")
        for lang in LANGUAGE_ABBR_IN_TITLE
        for path in load_existing_paths()
    }

    if not path_like_string:
        return None

    guessed_path = None
    path_candidates = gen_path_candidates(path_like_string, language)
    for candidate in path_candidates:
        if candidate in all_paths:
            guessed_path = candidate
            break

    return guessed_path


def get_issues_by_file(
    repo_name: str = "kubernetes/website",
) -> dict[str, list[GitHubIssue]]:
    """Get issues by file from a GitHub repository."""
    issues_by_file: dict[str, list[GitHubIssue]] = defaultdict(list)

    issues = _get_issues(repo_name=repo_name)
    for issue in issues:
        guessed_language = guess_language(issue)
        guessed_path = guess_path(issue, guessed_language) if guessed_language else None

        if guessed_path:
            issues_by_file[guessed_path].append(asdict(issue))

    return dict(issues_by_file)


if __name__ == "__main__":
    # issues_by_file = get_issues_by_file()
    # print(issues_by_file)

    print(
        gen_path_candidates(
            "content/en/docs/tasks/cluster-management/manage-deployment.md", "ja"
        )
    )
