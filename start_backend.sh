#!/bin/bash
# Start the backend server
cd "$(dirname "$0")/backend"
source venv/bin/activate
python app.py
