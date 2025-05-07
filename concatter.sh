#!/bin/bash

# Directory to read from
INPUT_DIR="$1"
# Output file
OUTPUT_FILE="$2"

# Check if both arguments are provided
if [ -z "$INPUT_DIR" ] || [ -z "$OUTPUT_FILE" ]; then
	echo "Usage: $0 <input_directory> <output_file>"
	exit 1
fi

# Create or empty the output file
>"$OUTPUT_FILE"

# Find and loop through all regular files recursively
find "$INPUT_DIR" -type f | while read -r file; do
	echo "===== START: $file =====" >>"$OUTPUT_FILE"
	cat "$file" >>"$OUTPUT_FILE"
	echo -e "\n===== END: $file =====\n" >>"$OUTPUT_FILE"
done

echo "All files under '$INPUT_DIR' have been merged into '$OUTPUT_FILE'."
