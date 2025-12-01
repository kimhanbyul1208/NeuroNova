"""
Environment Variable Validation Script for NeuroNova Django Backend

This script checks if all required environment variables are properly configured.
Run this before starting the Django server to catch configuration issues early.
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple

# Add the project root to the path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Required environment variables
REQUIRED_VARS = [
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
]

# Optional but recommended variables
RECOMMENDED_VARS = [
    'SECRET_KEY',
    'DEBUG',
    'ALLOWED_HOSTS',
    'DB_PORT',
    'REDIS_HOST',
    'REDIS_PORT',
    'FLASK_INFERENCE_URL',
    'ORTHANC_URL',
    'ORTHANC_USERNAME',
    'ORTHANC_PASSWORD',
]


def check_env_file() -> bool:
    """Check if .env file exists"""
    env_path = BASE_DIR / '.env'
    if not env_path.exists():
        print("[ERROR] .env file not found!")
        print(f"   Expected location: {env_path}")
        print("   Please copy .env.example to .env and configure it.")
        return False
    print(f"[OK] .env file found at {env_path}")
    return True


def load_env_vars() -> dict:
    """Load environment variables from .env file"""
    try:
        from decouple import config
        return {var: config(var, default=None) for var in REQUIRED_VARS + RECOMMENDED_VARS}
    except ImportError:
        print("[WARNING] python-decouple not installed. Using os.environ instead.")
        return {var: os.environ.get(var) for var in REQUIRED_VARS + RECOMMENDED_VARS}


def validate_required_vars(env_vars: dict) -> Tuple[bool, List[str]]:
    """Validate that all required variables are set"""
    missing = []
    for var in REQUIRED_VARS:
        value = env_vars.get(var)
        if not value or value == f'your-{var.lower().replace("_", "-")}':
            missing.append(var)
    return len(missing) == 0, missing


def validate_recommended_vars(env_vars: dict) -> List[str]:
    """Check recommended variables"""
    missing = []
    for var in RECOMMENDED_VARS:
        value = env_vars.get(var)
        if not value:
            missing.append(var)
    return missing


def print_summary(env_vars: dict, required_ok: bool, missing_required: List[str], missing_recommended: List[str]):
    """Print validation summary"""
    print("\n" + "="*60)
    print("ENVIRONMENT VARIABLE VALIDATION SUMMARY")
    print("="*60)
    
    if required_ok:
        print("\n[OK] All required variables are set!")
    else:
        print("\n[ERROR] MISSING REQUIRED VARIABLES:")
        for var in missing_required:
            print(f"   - {var}")
        print("\n   These variables MUST be configured in your .env file.")
        print("   The application will NOT work without them.")
    
    if missing_recommended:
        print("\n[WARNING] MISSING RECOMMENDED VARIABLES:")
        for var in missing_recommended:
            print(f"   - {var}")
        print("\n   These variables are optional but recommended for production.")
    
    # Show configured values (masked for security)
    print("\n[INFO] CONFIGURED VALUES:")
    for var in REQUIRED_VARS + RECOMMENDED_VARS:
        value = env_vars.get(var)
        if value:
            # Mask sensitive values
            if any(keyword in var.lower() for keyword in ['password', 'key', 'secret']):
                masked = value[:4] + '*' * (len(value) - 4) if len(value) > 4 else '****'
                print(f"   {var:30} = {masked}")
            else:
                print(f"   {var:30} = {value}")
        else:
            print(f"   {var:30} = <NOT SET>")
    
    print("\n" + "="*60)
    
    if required_ok:
        print("[OK] Environment configuration is valid!")
        print("   You can now run: python manage.py runserver")
    else:
        print("[ERROR] Environment configuration is INVALID!")
        print("   Please fix the missing variables before running Django.")
        print("\n   Quick fix:")
        print("   1. Open backend/django_main/.env")
        print("   2. Set the missing required variables")
        print("   3. Run this script again to validate")
    
    print("="*60 + "\n")


def main():
    """Main validation function"""
    print("\n[*] NeuroNova Environment Variable Validator\n")
    
    # Check if .env file exists
    if not check_env_file():
        sys.exit(1)
    
    # Load environment variables
    print("\n[*] Loading environment variables...")
    env_vars = load_env_vars()
    
    # Validate required variables
    print("[*] Validating required variables...")
    required_ok, missing_required = validate_required_vars(env_vars)
    
    # Check recommended variables
    print("[*] Checking recommended variables...")
    missing_recommended = validate_recommended_vars(env_vars)
    
    # Print summary
    print_summary(env_vars, required_ok, missing_required, missing_recommended)
    
    # Exit with appropriate code
    sys.exit(0 if required_ok else 1)


if __name__ == '__main__':
    main()
