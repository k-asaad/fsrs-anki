#!/usr/bin/env python3
"""
Setup script for FSRS-TS Backend with Anki Integration
This script helps set up the Anki library and dependencies.
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"Running: {description}")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✓ {description} completed successfully")
        if result.stdout:
            print(f"Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("✗ Python 3.9 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✓ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def check_anki_submodule():
    """Check if Anki submodule is present."""
    anki_path = Path(__file__).parent / "anki"
    if not anki_path.exists():
        print("✗ Anki submodule not found")
        print("Please run: git submodule update --init --recursive")
        return False
    print("✓ Anki submodule found")
    return True

def install_anki_library():
    """Install the Anki Python library."""
    anki_path = Path(__file__).parent / "anki" / "pylib"
    
    if not anki_path.exists():
        print("✗ Anki pylib directory not found")
        return False
    
    # Install Anki library in development mode
    command = f"cd {anki_path} && python -m pip install -e ."
    return run_command(command, "Installing Anki library")

def install_python_dependencies():
    """Install Python dependencies."""
    requirements = [
        "protobuf>=4.21",
        "requests[socks]",
        "orjson",
        "beautifulsoup4",
        "markdown",
        "decorator",
        "typing_extensions",
    ]
    
    for req in requirements:
        command = f"python -m pip install {req}"
        if not run_command(command, f"Installing {req}"):
            return False
    
    return True

def create_data_directory():
    """Create data directory for Anki collections."""
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(exist_ok=True)
    print(f"✓ Data directory created: {data_dir}")
    return True

def test_anki_import():
    """Test if Anki library can be imported."""
    try:
        # Add Anki path to Python path
        anki_path = Path(__file__).parent / "anki" / "pylib"
        sys.path.insert(0, str(anki_path))
        
        import anki
        from anki import Collection
        print("✓ Anki library imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Failed to import Anki library: {e}")
        return False

def main():
    """Main setup function."""
    print("Setting up FSRS-TS Backend with Anki Integration")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        sys.exit(1)
    
    if not check_anki_submodule():
        sys.exit(1)
    
    # Install dependencies
    if not install_python_dependencies():
        print("Failed to install Python dependencies")
        sys.exit(1)
    
    if not install_anki_library():
        print("Failed to install Anki library")
        sys.exit(1)
    
    # Create directories
    if not create_data_directory():
        print("Failed to create data directory")
        sys.exit(1)
    
    # Test installation
    if not test_anki_import():
        print("Failed to import Anki library")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✓ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Install Node.js dependencies: npm install")
    print("2. Start the development server: npm run dev")
    print("3. Test the API: curl http://localhost:3000/health")
    print("4. Import sample data: POST http://localhost:3000/anki/import/sample")

if __name__ == "__main__":
    main() 