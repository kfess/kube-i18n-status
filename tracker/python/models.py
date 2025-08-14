from typing import Literal, NotRequired, TypedDict

type OperationType = Literal["added", "modified", "deleted", "renamed"]


class GitFileChangeDict(TypedDict):
    """A TypedDict representing a Git file record."""

    path: str
    insertions: int
    deletions: int
    old_path: NotRequired[str]


class GitFileChangeSummaryDict(TypedDict):
    """A TypedDict representing a summary of changes in a Git commit."""

    total_files: int
    total_insertions: int
    total_deletions: int
    total_changes: int


class GitCommitDict(TypedDict):
    """A TypedDict representing a Git commit record."""

    hash: str
    author: str
    date: str
    message: str
    files: list[GitFileChangeDict]
    summary: GitFileChangeSummaryDict
