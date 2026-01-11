#!/bin/bash

cd "$(dirname "$0")"

bun run build
if [ $? -ne 0 ]; then
  echo "Failed to build."
  exit 1
fi

echo "Build commands executed successfully."
