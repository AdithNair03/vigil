"""Pytest configuration and shared fixtures for SDK Gateway tests."""

import sys
from pathlib import Path

import pytest

# Add the service root to sys.path so imports work
SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))
