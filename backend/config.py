"""
Configuration file for KLE Tech Digital Credential System
"""
import os
from datetime import timedelta

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'kle-tech-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///kle_credentials.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # ONEST Network Configuration
    ONEST_BASE_URL = os.environ.get('ONEST_BASE_URL') or 'https://onest.network'
    ONEST_PROVIDER_ID = os.environ.get('ONEST_PROVIDER_ID') or 'kle-tech-university'
    
    # DID Configuration
    DID_METHOD = 'did:key'
    DID_ALGORITHM = 'Ed25519'
    
    # Credential Configuration
    CREDENTIAL_CONTEXT = [
        "https://www.w3.org/2018/credentials/v1",
        "https://www.w3.org/2018/credentials/examples/v1"
    ]
    
    # Batch Processing Configuration
    BATCH_CHUNK_SIZE = 20
    MAX_WORKERS = 4
    
    # Verification Configuration
    VERIFICATION_TIMEOUT = 2  # seconds
    MAX_VERIFICATION_COUNT = 1000
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'csv', 'json'}
    
    # Email Configuration (optional)
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # CORS Configuration
    CORS_ORIGINS = ['http://localhost:5000', 'http://127.0.0.1:5000']

