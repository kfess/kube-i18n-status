import re
from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Literal, TypedDict

from history import GitFileRevision, GitFileHistoryTracker

type LANGUAGE_CODE = Literal[
    "bn",
    "de",
    "en",
    "es",
    "fr",
    "hi",
    "id",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-br",
    "ru",
    "uk",
    "vi",
    "zh-cn",
]

LANGUAGE_CODES = [
    "bn",
    "de",
    "en",
    "es",
    "fr",
    "hi",
    "id",
    "it",
    "ja",
    "ko",
    "pl",
    "pt-br",
    "ru",
    "uk",
    "vi",
    "zh-cn",
]

type DEPRECATED_LANGUAGE_CODE = Literal[
    "cn",  # Chinese
    "zh",  # Chinese
    "pt",  # Portuguese
    "no",  # Norwegian
]


class TranslationStatus(str, Enum):
    """Enum representing the translation status of a file."""

    UP_TO_DATE = "up_to_date"
    OUTDATED = "outdated"
    NOT_TRANSLATED = "not_translated"
    NO_ENGLISH_VERSION = "no_english_version"


class OutdatedSeverity(str, Enum):
    """Enum representing the severity of an outdated translation."""

    CURRENT = "current"
    MINOR = "minor"
    MODERATE = "moderate"
    SIGNIFICANT = "significant"
    CRITICAL = "critical"


class TranslationStatusResult(TypedDict):
    """A TypedDict representing the translation status of a file."""

    target_path: str
    english_path: str
    target_latest_date: datetime | None
    english_latest_date: datetime | None
    days_behind: int
    commits_behind: int
    total_changes: int
    insertions_behind: int
    deletions_behind: int
    status: TranslationStatus
    severity: OutdatedSeverity
    missing_commits: list[GitFileRevision]


@dataclass
class LanguagePath:
    """Language-specific path information."""

    original_path: str
    language_code: LANGUAGE_CODE | None
    english_equiv: str

    @classmethod
    def from_path(cls, path: str) -> "LanguagePath":
        """Create LanguagePath from a file path."""
        lang_match = re.match(r"content/([a-z\-]+)/", path)
        language_code = lang_match.group(1) if lang_match else None
        english_equiv = re.sub(r"^content/[a-z\-]+/", "content/en/", path)

        return cls(
            original_path=path,
            language_code=language_code,
            english_equiv=english_equiv,
        )

    @property
    def is_english(self) -> bool:
        """Check if this is an English path."""
        return self.language_code == "en"

    @property
    def is_translated(self) -> bool:
        """Check if this is a translated (non-English) path."""
        return self.language_code is not None and self.language_code != "en"


class TranslationStatusTracker:
    """A class to track the translation status of files in a repository."""

    def __init__(
        self,
        file_history_tracker: GitFileHistoryTracker,
        existing_paths: set[str],
    ) -> None:
        """Initialize the TranslationStatusTracker with a file history tracker."""
        self.file_history_tracker = file_history_tracker
        self.existing_paths = existing_paths

    def analyze(
        self,
        target_languages: list[LANGUAGE_CODE] | None = None,
    ) -> dict[str, TranslationStatusResult]:
        """Analyze the translation status for all translated files."""
        if target_languages is None:
            target_languages = LANGUAGE_CODES

        results = {}

        english_paths = [
            path
            for path in self.file_history_tracker.all_paths
            if path.startswith("content/en/") and path in self.existing_paths
        ]

        english_latest_cache = self._build_english_latest_cache()

        for english_path in english_paths:
            english_latest_commit = english_latest_cache.get(english_path)

            if not english_latest_commit:
                continue

            for lang_code in target_languages:
                translated_path = self._get_translated_path(english_path, lang_code)
                result = self._analyze_translation_pair(
                    english_path, english_latest_commit, translated_path
                )

                if result:
                    results[translated_path] = result

        return results

    def _build_english_latest_cache(self) -> dict[str, GitFileRevision]:
        """Build cache of latest commits for all English files."""
        cache: dict[str, GitFileRevision] = {}

        english_paths = [
            path
            for path in self.file_history_tracker.all_paths
            if path.startswith("content/en/") and path in self.existing_paths
        ]

        for path in english_paths:
            latest = self.file_history_tracker.get_latest_commit(path)
            if latest:
                cache[path] = latest

        return cache

    def _get_translated_path(
        self,
        english_path: str,
        lang_code: LANGUAGE_CODE,
    ) -> str:
        """Convert English path to translated path for given language.

        Args:
        ----
            english_path (str): The path of the English file.
            lang_code (LANGUAGE_CODE): The language code for the translation.

        Returns:
        -------
            str: The path of the translated file in the specified language.

        """
        return english_path.replace("content/en/", f"content/{lang_code}/")

    def _analyze_translation_pair(
        self,
        english_path: str,
        english_latest: GitFileRevision,
        translated_path: str,
    ) -> TranslationStatusResult | None:
        """Analyze translation status for an English-translation file pair."""
        translated_latest = self.file_history_tracker.get_latest_commit(translated_path)

        if not translated_latest:
            return self._create_missing_translation_result(
                english_path,
                english_latest,
                translated_path,
            )

        translated_date = self._parse_date(translated_latest["date"])
        english_date = self._parse_date(english_latest["date"])

        missing_commits = self._get_commits_since(english_path, translated_date)
        change_stats = self._calculate_change_stats(missing_commits)

        days_behind = (english_date - translated_date).days
        status = (
            TranslationStatus.UP_TO_DATE
            if days_behind <= 0
            else TranslationStatus.OUTDATED
        )
        severity = self._calculate_severity(change_stats["total_changes"])

        return TranslationStatusResult(
            target_path=translated_path,
            english_path=english_path,
            target_latest_date=translated_date,
            english_latest_date=english_date,
            days_behind=max(0, days_behind),
            commits_behind=len(missing_commits),
            total_changes=change_stats["total_changes"],
            insertions_behind=change_stats["insertions"],
            deletions_behind=change_stats["deletions"],
            status=status,
            severity=severity,
            missing_commits=missing_commits,
        )

    def _create_missing_translation_result(
        self,
        english_path: str,
        english_latest: GitFileRevision,
        translated_path: str,
    ) -> TranslationStatusResult:
        """Create result for missing translation files.

        Args:
        ----
            english_path (str): The path of the English file.
            english_latest (GitFileRevision): The latest commit for the English file.
            translated_path (str): The path of the translated file.

        Returns:
        -------
            TranslationStatusResult: The result indicating no translation exists.

        """
        english_date = self._parse_date(english_latest["date"])

        file_history = self.file_history_tracker.get_file_history(english_path)
        total_english_changes = sum(
            (commit.get("insertions", 0) or 0) + (commit.get("deletions", 0) or 0)
            for commit in file_history
        )

        return TranslationStatusResult(
            target_path=translated_path,
            english_path=english_path,
            target_latest_date=None,
            english_latest_date=english_date,
            days_behind=(datetime.now(tz=timezone.utc) - english_date).days,
            commits_behind=len(file_history),
            total_changes=total_english_changes,
            insertions_behind=sum(c.get("insertions", 0) or 0 for c in file_history),
            deletions_behind=sum(c.get("deletions", 0) or 0 for c in file_history),
            status=TranslationStatus.NOT_TRANSLATED,
            severity=self._calculate_severity(total_english_changes),
            missing_commits=file_history,
        )

    def _get_commits_since(
        self, path: str, since_date: datetime
    ) -> list[GitFileRevision]:
        """Get commits for a path since the specified date.

        Args:
        ----
            path (str): The file path to check.
            since_date (datetime): The date to filter commits.

        Returns:
        -------
            list[GitFileRevision]: List of commits after the specified date.

        """
        file_history = self.file_history_tracker.get_file_history(path)
        return [
            commit
            for commit in file_history
            if self._parse_date(commit["date"]) > since_date
        ]

    def _parse_date(self, date_str: str) -> datetime:
        """Parse Git date string to datetime.

        Args:
        ----
            date_str (str): The date string from a Git commit.

        Returns:
        -------
            datetime: Parsed datetime object.

        """
        return datetime.fromisoformat(date_str.replace(" ", "T"))

    def _calculate_change_stats(self, commits: list[GitFileRevision]) -> dict[str, int]:
        """Calculate change statistics from commits.

        Args:
        ----
            commits (list[GitFileRevision]): List of commit history for a file.

        Returns:
        -------
            dict[str, int]: A dictionary containing total insertions,
                            deletions, and total changes.

        """
        total_insertions = sum(c.get("insertions", 0) or 0 for c in commits)
        total_deletions = sum(c.get("deletions", 0) or 0 for c in commits)

        return {
            "insertions": total_insertions,
            "deletions": total_deletions,
            "total_changes": total_insertions + total_deletions,
        }

    def _calculate_severity(self, total_changes: int) -> OutdatedSeverity:
        """Calculate outdated severity based on total changes.

        Args:
        ----
            total_changes (int): The total number of changes in the translation file.

        Returns:
        -------
            OutdatedSeverity: The severity level of the outdated translation.

        """
        if total_changes == 0:
            return OutdatedSeverity.CURRENT
        elif total_changes <= 50:  # noqa: PLR2004, RET505
            return OutdatedSeverity.MINOR
        elif total_changes <= 200:  # noqa: PLR2004
            return OutdatedSeverity.MODERATE
        elif total_changes <= 500:  # noqa: PLR2004
            return OutdatedSeverity.SIGNIFICANT
        return OutdatedSeverity.CRITICAL
