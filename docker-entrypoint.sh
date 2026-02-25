#!/bin/sh
# Fix volume permissions — Fly volumes are mounted as root,
# but we run the app as appuser for security.
# This script runs as root, fixes ownership, then drops to appuser.

chown -R appuser:appgroup /app/uploads

exec su-exec appuser "$@"
