import os
import sys
import subprocess
from pathlib import Path

def build_frontend():
    frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
    dist_dir = frontend_dir / "dist"
    if not dist_dir.exists():
        print("Building React frontend for unified single-server setup...")
        subprocess.run("npm run build", shell=True, cwd=frontend_dir)

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    build_frontend()
    print("\n" + "="*70)
    print("SMART CO-WORKING SPACE PLATFORM (UNIFIED SINGLE SERVER)")
    print("="*70)
    print("Full Web Application (Frontend + Backend): http://127.0.0.1:8000/")
    print("Django Admin Dashboard:                  http://127.0.0.1:8000/admin/")
    print("WhatsApp Alerts Target Number:           +91 9380747558")
    print("="*70 + "\n")
    
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])
