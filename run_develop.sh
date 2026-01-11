#!/bin/bash

cd "$(dirname "$0")"

(
  bun run develop
) & (
  bun run serve
)

# Wait for all background processes to complete.
wait
