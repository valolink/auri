#!/bin/bash

# Input: Subdirectory to scan
INPUT_DIR="$1"
# Output: Path to merged output file
OUTPUT_FILE="$2"

# Check input
if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_FILE" ]; then
	echo "Usage: $0 <input_directory> <output_file>"
	exit 1
fi

# Convert to absolute paths
REPO_ROOT=$(git rev-parse --show-toplevel)
ABS_INPUT_DIR=$(realpath "$INPUT_DIR")
ABS_OUTPUT_FILE=$(realpath "$OUTPUT_FILE")

# Sanity check: Ensure input is inside repo
if [[ "$ABS_INPUT_DIR" != "$REPO_ROOT"* ]]; then
	echo "Error: Input directory must be inside the Git repository ($REPO_ROOT)."
	exit 1
fi

# Move to repo root for consistent git checks
cd "$REPO_ROOT" || exit 1

# Strip repo root prefix to get path relative to root
REL_INPUT_DIR="${ABS_INPUT_DIR#$REPO_ROOT/}"
REL_OUTPUT_FILE="${ABS_OUTPUT_FILE#$REPO_ROOT/}"

# Create or empty the output file
>"$REL_OUTPUT_FILE"

# Find all files under the relative input dir
find "$REL_INPUT_DIR" -type f | while read -r file; do
	# Skip if ignored by Git
	if git check-ignore -q "$file"; then
		continue
	fi
	echo "===== START: $file =====" >>"$REL_OUTPUT_FILE"
	cat "$file" >>"$REL_OUTPUT_FILE"
	echo -e "\n===== END: $file =====\n" >>"$REL_OUTPUT_FILE"
done

echo "Merged all non-ignored files under '$REL_INPUT_DIR' into '$REL_OUTPUT_FILE'."
