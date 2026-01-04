"""
Main entry point for KLE Tech Digital Credential System
Run this file to start the application
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app import create_app

if __name__ == '__main__':
    app = create_app()
    print("\n" + "="*60)
    print("KLE Tech Digital Credential System")
    print("="*60)
    print("\nAccess URLs:")
    print("   Home:        http://localhost:5000/")
    print("   Admin:       http://localhost:5000/admin")
    print("   Student:     http://localhost:5000/student")
    print("   Verifier:    http://localhost:5000/verifier")
    print("\nDefault Admin Credentials:")
    print("   Username: admin")
    print("   Password: admin123")
    print("\n" + "="*60 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)

