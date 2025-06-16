#!/bin/bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}[INFO]${NC} $*" >&2
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $*" >&2
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_PATH="${ROOT_DIR}/k8s-repo/website"
OUTPUT_DIR="${ROOT_DIR}/data/master"
OUTPUT_FILE="${OUTPUT_DIR}/git_history.jsonl"
CACHE_DIR="${ROOT_DIR}/data/cache"
LAST_COMMIT_FILE="${CACHE_DIR}/last_commit.txt"

mkdir -p "${OUTPUT_DIR}"
mkdir -p "${CACHE_DIR}"

fetch_history_jsonl() {
  local start_commit=$1
  local end_commit=$2
  local output_file=$3

  local commit_range=""
  if [ -n "$start_commit" ] && [ -n "$end_commit" ]; then
    commit_range="${start_commit}..${end_commit}"
  fi

  git log --pretty=format:'%H%x1F%an%x1F%ad%x1F%s' --first-parent --numstat --date=iso --cc ${commit_range} -- content/ | \
  awk '
    BEGIN {
      RS="";
      FS="\n";
    }
    {
      if (NF == 0) next;

      # 最初の行はコミット情報
      split($1, meta, "\x1F");
      hash = meta[1];
      author = meta[2];
      date = meta[3];
      message = meta[4];

      # ファイル変更情報を配列に格納
      delete files;
      total_files = 0;
      total_insertions = 0;
      total_deletions = 0;

      for (i = 2; i <= NF; i++) {
        if ($i ~ /^[0-9\-]/ && $i ~ /content/) {
          split($i, stats, "\t");
          insertions = stats[1];
          deletions = stats[2];
          filepath = stats[3];

          # バイナリファイルの場合の処理
          if (insertions == "-") {
            insertions_num = 0;
            insertions_val = "null";
          } else {
            insertions_num = insertions;
            insertions_val = insertions;
            total_insertions += insertions_num;
          }

          if (deletions == "-") {
            deletions_num = 0;
            deletions_val = "null";
          } else {
            deletions_num = deletions;
            deletions_val = deletions;
            total_deletions += deletions_num;
          }

          # リネーム処理の改善
          old_path = "";
          new_path = filepath;
          
          if (filepath ~ /{.*=>.*}/) {
            # 波括弧記法の解析
            old_path = parse_rename_path(filepath, "old");
            new_path = parse_rename_path(filepath, "new");
          } else {
            new_path = clean_path(filepath);
          }

          # ファイル情報を配列に格納
          file_data = new_path "|" insertions_val "|" deletions_val;
          if (old_path != "") {
            file_data = file_data "|" old_path;
          }
          files[total_files] = file_data;
          total_files++;
        }
      }

      if (total_files > 0) {
        # JSONの各部分を準備
        json_hash = "\"" hash "\"";
        json_author = "\"" escape_json(author) "\"";
        json_date = "\"" date "\"";
        json_message = "\"" escape_json(message) "\"";

        # files配列をJSONに変換
        files_json = "[";
        for (j = 0; j < total_files; j++) {
          split(files[j], file_parts, "|");
          file_path = file_parts[1];
          file_insertions = file_parts[2];
          file_deletions = file_parts[3];
          file_old_path = (length(file_parts) > 3) ? file_parts[4] : "";

          if (j > 0) files_json = files_json ",";

          files_json = files_json "{" \
            "\"path\":\"" escape_json(file_path) "\"," \
            "\"insertions\":" file_insertions "," \
            "\"deletions\":" file_deletions;

          # リネームの場合は元のパスも追加
          if (file_old_path != "") {
            files_json = files_json ",\"old_path\":\"" escape_json(file_old_path) "\"";
          }

          files_json = files_json "}";
        }
        files_json = files_json "]";

        total_changes = total_insertions + total_deletions;

        # 最終的なJSONを構築
        json_output = "{" \
          "\"hash\":" json_hash "," \
          "\"author\":" json_author "," \
          "\"date\":" json_date "," \
          "\"message\":" json_message "," \
          "\"files\":" files_json "," \
          "\"summary\":{" \
            "\"total_files\":" total_files "," \
            "\"total_insertions\":" total_insertions "," \
            "\"total_deletions\":" total_deletions "," \
            "\"total_changes\":" total_changes \
          "}" \
        "}";

        print json_output;
      }
    }

    # 波括弧記法のリネームパスを解析する関数
    function parse_rename_path(path, type) {
      # path: "content/zh-cn/blog/_posts/{2025-02-03-introducing-jobset => 2025-03-23-introducing-jobset}/index.md"
      # type: "old" または "new"
      
      # 波括弧の位置を特定
      brace_start = index(path, "{");
      brace_end = index(path, "}");
      
      if (brace_start == 0 || brace_end == 0) {
        return clean_path(path);
      }
      
      # 前部分、波括弧内部分、後部分に分割
      prefix = substr(path, 1, brace_start - 1);
      brace_content = substr(path, brace_start + 1, brace_end - brace_start - 1);
      suffix = substr(path, brace_end + 1);
      
      # " => " で分割
      arrow_pos = index(brace_content, " => ");
      if (arrow_pos == 0) {
        return clean_path(path);
      }
      
      old_part = substr(brace_content, 1, arrow_pos - 1);
      new_part = substr(brace_content, arrow_pos + 4);
      
      # 前後の空白を除去
      gsub(/^ +| +$/, "", old_part);
      gsub(/^ +| +$/, "", new_part);
      
      if (type == "old") {
        return clean_path(prefix old_part suffix);
      } else {
        return clean_path(prefix new_part suffix);
      }
    }

    # パスのクリーニング関数
    function clean_path(path) {
      # 先頭と末尾のクォートを除去
      if (path ~ /^".*"$/) {
        path = substr(path, 2, length(path) - 2);
      }
      return path;
    }

    # JSON文字列のエスケープ関数
    function escape_json(str) {
      # バックスラッシュを最初に処理
      gsub(/\\/, "\\\\", str);
      # ダブルクォート
      gsub(/"/, "\\\"", str);
      # 改行・タブ・復帰文字
      gsub(/\r/, "\\r", str);
      gsub(/\n/, "\\n", str);
      gsub(/\t/, "\\t", str);
      gsub(/\b/, "\\b", str);
      gsub(/\f/, "\\f", str);

      # 制御文字を16進数で検出して置換
      # ベル文字 (ASCII 7)
      gsub(/\007/, "\\u0007", str);
      # 垂直タブ (ASCII 11)
      gsub(/\013/, "\\u000B", str);

      return str;
    }
  ' >> "$output_file"
}

if [ ! -d "$REPO_PATH" ]; then
  log_info "Clone the Kubernetes repository..."
  mkdir -p "$(dirname "$REPO_PATH")"
  git clone -b main --single-branch https://github.com/kubernetes/website.git "$REPO_PATH"
fi

cd "$REPO_PATH"

log_info "Updating the repository to the latest version..."
git pull origin main

CURRENT_HEAD=$(git rev-parse HEAD)

if [ -f "$LAST_COMMIT_FILE" ]; then
  LAST_COMMIT=$(cat "$LAST_COMMIT_FILE")
  log_info "Fetching new commits since last processed commit: ${LAST_COMMIT} → ${CURRENT_HEAD}"

  if git merge-base --is-ancestor "$LAST_COMMIT" "$CURRENT_HEAD"; then
    fetch_history_jsonl "$LAST_COMMIT" "$CURRENT_HEAD" "$OUTPUT_FILE"
  else
    log_warn "Previous commit not found in history. Fetching full history."
    fetch_history_jsonl "" "" "$OUTPUT_FILE"
  fi
else
  log_info "First run or no previous commit information. Fetching full history."
  fetch_history_jsonl "" "" "$OUTPUT_FILE"
fi

echo "$CURRENT_HEAD" > "$LAST_COMMIT_FILE"
log_success "JSONL file created/updated: $OUTPUT_FILE"
log_success "Last processed commit hash: $CURRENT_HEAD"