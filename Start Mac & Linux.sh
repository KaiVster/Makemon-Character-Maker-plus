#!/usr/bin/env bash

echo "Makemon Character Maker + (MAC OS & Linux)"
echo "======================================"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the script's directory to serve files correctly
cd "$SCRIPT_DIR"

# Attempt to open the page in the default browser
URL='http://localhost:8000/app/Makemon.html'
if command -v xdg-open &> /dev/null; then
  xdg-open "$URL" &>/dev/null &
echo "Attempting to open $URL in your browser (using xdg-open)..."
elif command -v open &> /dev/null; then
  open "$URL" &>/dev/null &
echo "Attempting to open $URL in your browser (using open)..."
else
  echo "Could not automatically open your browser."
  echo "Please navigate to $URL manually."
fi
echo ""

# Check for Python 3
if command -v python3 &> /dev/null; then
    echo "Starting server with Python 3..."
    echo "Server running at http://localhost:8000"
    echo "Serving files from: $(pwd)"
    echo "Press Ctrl+C to stop the server."
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then # Check for Python (could be Python 2)
    echo "Python 3 not found. Starting server with Python (likely Python 2)..."
    echo "Server running at http://localhost:8000"
    echo "Serving files from: $(pwd)"
    echo "Press Ctrl+C to stop the server."
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v npx &> /dev/null; then # Check for Node.js http-server via npx
    echo "Python not found. Starting server with Node.js http-server..."
    echo "If http-server is not installed, npx will offer to install it temporarily."
    echo "Server running at http://localhost:8000"
    echo "Serving files from: $(pwd)"
    echo "Press Ctrl+C to stop the server."
    echo ""
    npx http-server -p 8000
else
    echo "Error: Python (v2 or v3) and Node.js (with npx) not found."
    echo "Please install Python or Node.js to run this server."
    echo "Python install hints:"
    echo "  macOS: brew install python"
    echo "  Linux (Debian/Ubuntu): sudo apt update && sudo apt install python3"
    echo "  Linux (Fedora): sudo dnf install python3"
    echo "Node.js install hints: Visit https://nodejs.org/"
    exit 1
fi
