#!/usr/bin/env bash
set -euo pipefail

# ---------------------------
# Config
# ---------------------------
PLUGIN_DIR="auriapp"
PLUGIN_MAIN="$PLUGIN_DIR/valolink-auriapp.php"
PKG_JSON="package.json"
ZIP_NAME="valolink-auriapp"
BUILD_CMD="npm run build-only" # your build command
DIST_DIR="dist"                # created by build
TAG_PREFIX="v"                 # tags like v1.2.3
DEFAULT_BUMP="patch"           # if user doesn't provide a version
REMOTE_NAME="origin"
COMMIT_PREFIX="chore(release):"
MANIFEST_JSON="manifest.json"
MANIFEST_VERSION_JQ='.version'
MANIFEST_URL_JQ='.download_url'
ASSET_NAME_TEMPLATE='${ZIP_NAME}.zip'
# leave DOWNLOAD_URL_TEMPLATE empty to auto-derive from repo/tag/asset name:
DOWNLOAD_URL_TEMPLATE=""
# ---------------------------
# Helpers
# ---------------------------
log() { printf "\033[1;34m[release]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
error() { printf "\033[1;31m[error]\033[0m %s\n" "$*"; }

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		error "Required command '$1' not found. Please install it."
		exit 1
	fi
}

# macOS/BSD vs GNU sed in-place portability
sed_inplace() {
	local pattern="$1" file="$2"
	if sed --version >/dev/null 2>&1; then
		# GNU sed
		sed -i -E "$pattern" "$file"
	else
		# BSD sed (macOS)
		sed -i '' -E "$pattern" "$file"
	fi
}

parse_semver() {
	local v="${1#v}"
	IFS='.' read -r MAJ MIN PAT <<<"$v"
	echo "$MAJ" "$MIN" "$PAT"
}

bump_semver() {
	local v="${1#v}" kind="$2"
	read -r MAJ MIN PAT < <(parse_semver "$v")
	MAJ=${MAJ:-0}
	MIN=${MIN:-0}
	PAT=${PAT:-0}
	case "$kind" in
	patch) PAT=$((PAT + 1)) ;;
	minor)
		MIN=$((MIN + 1))
		PAT=0
		;;
	major)
		MAJ=$((MAJ + 1))
		MIN=0
		PAT=0
		;;
	*)
		error "Unknown bump '$kind'"
		exit 1
		;;
	esac
	echo "$MAJ.$MIN.$PAT"
}

get_pkg_version() {
	# expects jq
	jq -r '.version' "$PKG_JSON"
}

set_pkg_version() {
	local v="$1"
	tmp="$(mktemp)"
	jq --arg v "$v" '.version = $v' "$PKG_JSON" >"$tmp"
	mv "$tmp" "$PKG_JSON"
}

update_wp_plugin_header_version() {
	local v="$1" file="$PLUGIN_MAIN"
	# Replace "Version: X.Y.Z" (common WP plugin header format)
	if grep -Eq '^[[:space:]]*\*?[[:space:]]*Version:[[:space:]]*[0-9]+' "$file"; then
		sed_inplace "s/^([[:space:]]*\*?[[:space:]]*Version:[[:space:]]*)[0-9]+\.[0-9]+\.[0-9]+/\1${v}/" "$file"
	else
		warn "Could not find a 'Version:' header in $file; no change made."
	fi
}

confirm_clean_git() {
	if ! git diff --quiet || ! git diff --cached --quiet; then
		error "Your git working tree has uncommitted changes. Commit or stash before releasing."
		exit 1
	fi
}

tag_exists() {
	local tag="$1"
	git rev-parse -q --verify "refs/tags/$tag" >/dev/null 2>&1
}

copy_dist_into_plugin() {
	local src="$DIST_DIR" dst="$PLUGIN_DIR/$DIST_DIR"
	if [[ ! -d "$src" ]]; then
		error "Build output '$src' not found."
		exit 1
	fi
	rm -rf "$dst"
	mkdir -p "$PLUGIN_DIR"
	cp -R "$src" "$dst"
}

zip_plugin_dir() {
	local v="$1"
	local zip="${ZIP_NAME}.zip"
	rm -f "$zip"
	# Zip contents of PLUGIN_DIR into top-level folder of the same name
	(cd "$PLUGIN_DIR" && zip -r "../$zip" . >/dev/null)
	echo "$zip"
}

# Build the asset file name string from template vars
render_asset_name() {
	# shellcheck disable=SC2034
	local ASSET_NAME_PREFIX="$ASSET_NAME_PREFIX" NEW_VERSION="$NEW_VERSION"
	eval "printf '%s' \"$ASSET_NAME_TEMPLATE\""
}

# Repo "owner/name" from gh (fallback: parse git remote)
repo_slug() {
	if gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null; then
		return 0
	fi
	# Fallback if gh json fails (handles https and ssh remotes)
	local url
	url="$(git remote get-url "$REMOTE_NAME")" || return 1
	url="${url%.git}"
	case "$url" in
	https://github.com/*) echo "${url#https://github.com/}" ;;
	git@github.com:*) echo "${url#git@github.com:}" ;;
	*)
		echo ""
		return 1
		;;
	esac
}

# Compose the download URL used by the updater
compose_download_url() {
	local asset
	asset="$(render_asset_name)"
	if [[ -n "$DOWNLOAD_URL_TEMPLATE" ]]; then
		# shellcheck disable=SC2034
		local ASSET_NAME_TEMPLATE="$asset"
		eval "printf '%s' \"$DOWNLOAD_URL_TEMPLATE\""
		return
	fi
	local slug
	slug="$(repo_slug)" || slug=""
	if [[ -z "$slug" ]]; then
		error "Could not determine GitHub repo slug for download URL; set DOWNLOAD_URL_TEMPLATE."
		exit 1
	fi
	printf 'https://github.com/%s/releases/download/%s/%s.zip' "$slug" "$TAG_NAME" "$ZIP_NAME"
}

update_manifest_json() {
	local v="$1" url="$2" file="$MANIFEST_JSON"
	if [[ ! -f "$file" ]]; then
		error "Manifest file not found: $file"
		exit 1
	fi
	local tmp
	tmp="$(mktemp)"
	# Build a single jq program that assigns both fields
	local jq_prog="$MANIFEST_VERSION_JQ = \$v | $MANIFEST_URL_JQ = \$u"
	jq --arg v "$v" --arg u "$url" "$jq_prog" "$file" >"$tmp"
	mv "$tmp" "$file"
	log "Updated $file ($MANIFEST_VERSION_JQ=$v, $MANIFEST_URL_JQ=$url)"
}

# ---------------------------
# CLI args
# ---------------------------
DRY_RUN=0
BUMP_KIND="$DEFAULT_BUMP"
EXPLICIT_VERSION=""

usage() {
	cat <<EOF
Usage: $0 [--dry-run] [--patch|--minor|--major] [--version X.Y.Z]

If --version is provided, it overrides the bump.
Default bump is '$DEFAULT_BUMP'.

Examples:
  $0 --minor
  $0 --version 1.4.0
  $0 --dry-run --patch
EOF
}

while [[ $# -gt 0 ]]; do
	case "$1" in
	--dry-run)
		DRY_RUN=1
		shift
		;;
	--patch | --minor | --major)
		BUMP_KIND="${1#--}"
		shift
		;;
	--version)
		EXPLICIT_VERSION="${2:-}"
		shift 2
		;;
	-h | --help)
		usage
		exit 0
		;;
	*)
		error "Unknown arg: $1"
		usage
		exit 1
		;;
	esac
done

# ---------------------------
# Pre-flight checks
# ---------------------------
require_cmd git
require_cmd jq
require_cmd npm
require_cmd zip
require_cmd gh

# ensure gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
	error "GitHub CLI (gh) not authenticated. Run: gh auth login"
	exit 1
fi

# ensure we are in a git repo with an origin
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
	error "Not a git repository."
	exit 1
}
git remote get-url "$REMOTE_NAME" >/dev/null 2>&1 || {
	error "Remote '$REMOTE_NAME' not configured."
	exit 1
}

if ((!DRY_RUN)); then
	confirm_clean_git
	git fetch --tags --quiet
fi
# ---------------------------
# Determine version
# ---------------------------
CURRENT="$(get_pkg_version)"
if [[ -z "$CURRENT" || "$CURRENT" == "null" ]]; then
	error "Couldn't read current version from $PKG_JSON"
	exit 1
fi

NEW_VERSION=""
if [[ -n "$EXPLICIT_VERSION" ]]; then
	NEW_VERSION="$EXPLICIT_VERSION"
else
	NEW_VERSION="$(bump_semver "$CURRENT" "$BUMP_KIND")"
fi

TAG_NAME="${TAG_PREFIX}${NEW_VERSION}"

log "Current package.json version: $CURRENT"
log "New version: $NEW_VERSION (tag: $TAG_NAME)"

if tag_exists "$TAG_NAME"; then
	error "Tag '$TAG_NAME' already exists. Choose another version."
	exit 1
fi

# ---------------------------
# Apply changes
# ---------------------------
log "Updating versions…"
if ((DRY_RUN)); then
	warn "[dry-run] Would update $PKG_JSON to $NEW_VERSION"
	warn "[dry-run] Would update $PLUGIN_MAIN 'Version:' to $NEW_VERSION"
else
	set_pkg_version "$NEW_VERSION"
	update_wp_plugin_header_version "$NEW_VERSION"
fi

# --- Manifest update (version + download URL) ---
DOWNLOAD_URL="$(compose_download_url)"
if ((DRY_RUN)); then
	warn "[dry-run] Would update $MANIFEST_JSON: $MANIFEST_VERSION_JQ=$NEW_VERSION, $MANIFEST_URL_JQ=$DOWNLOAD_URL"
else
	update_manifest_json "$NEW_VERSION" "$DOWNLOAD_URL"
fi

# ---------------------------
# Build & copy dist
# ---------------------------
log "Building… ($BUILD_CMD)"
if ((DRY_RUN)); then
	warn "[dry-run] Would run: $BUILD_CMD"
	warn "[dry-run] Would copy '$DIST_DIR' to '$PLUGIN_DIR/$DIST_DIR'"
else
	eval "$BUILD_CMD"
	copy_dist_into_plugin
fi

# ---------------------------
# Commit, tag, push
# ---------------------------
COMMIT_MSG="$COMMIT_PREFIX v$NEW_VERSION"

if ((DRY_RUN)); then
	warn "[dry-run] Would: git add -A"
	warn "[dry-run] Would: git commit -m \"$COMMIT_MSG\""
	warn "[dry-run] Would: git tag \"$TAG_NAME\""
	warn "[dry-run] Would: git push $REMOTE_NAME HEAD"
	warn "[dry-run] Would: git push $REMOTE_NAME \"$TAG_NAME\""
else
	git add -A
	git commit -m "$COMMIT_MSG"
	git tag "$TAG_NAME"
	git push "$REMOTE_NAME" HEAD
	git push "$REMOTE_NAME" "$TAG_NAME"
fi

# ---------------------------
# Zip artifact
# ---------------------------
log "Packaging plugin directory…"
ZIPFILE=""
if ((DRY_RUN)); then
	ZIPFILE="${ZIP_NAME}.zip"
	warn "[dry-run] Would create $ZIPFILE"
else
	ZIPFILE="$(zip_plugin_dir "$NEW_VERSION")"
	log "Created $ZIPFILE"
fi

# ---------------------------
# GitHub Release
# ---------------------------
log "Creating GitHub release…"
if ((DRY_RUN)); then
	warn "[dry-run] Would run: gh release create \"$TAG_NAME\" \"$ZIPFILE\" --title \"$TAG_NAME\" --notes \"Release $TAG_NAME\""
else
	gh release create "$TAG_NAME" "$ZIPFILE" --title "$TAG_NAME" --notes "Release $TAG_NAME"
	log "Release $TAG_NAME created."
fi

log "Done."
