#!/bin/bash

set -e  # Exit on error

ROOT_DIR="."  # Because the script is inside rust/

for dir in "$ROOT_DIR"/*/; do
    # Only proceed if it's a directory
    if [[ ! -d "$dir" ]]; then
        continue
    fi
    folder_name=$(basename "$dir")

    # Skip specific folders
    if [[ "$folder_name" == "graph" || "$folder_name" == "algorithm" ]]; then
        echo "Skipping $folder_name"
        continue
    fi

    echo "Building $folder_name..."
    (cd "$dir" && wasm-pack build --target web)
done

echo "✅ All builds done."
