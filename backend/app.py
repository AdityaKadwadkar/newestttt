"""
Main Flask Application for KLE Tech Digital Credential System
"""
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from backend.config import Config
from backend.models import db
from backend.routes import admin_routes, student_routes, verifier_routes, onest_routes
import os

def create_app():
    """Create and configure Flask app"""
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app = Flask(__name__, 
                template_folder=os.path.join(base_dir, 'frontend'),
                static_folder=os.path.join(base_dir, 'static'))
    
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    # Allow all origins in development
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    jwt = JWTManager(app)
    
    # Register blueprints
    app.register_blueprint(admin_routes.bp, url_prefix='/api/admin')
    app.register_blueprint(student_routes.bp, url_prefix='/api/student')
    app.register_blueprint(verifier_routes.bp, url_prefix='/api/verifier')
    app.register_blueprint(onest_routes.bp, url_prefix='/api/onest')
    
    # Serve frontend pages
    @app.route('/')
    def index():
        return render_template('index.html')
    
    @app.route('/admin')
    def admin_dashboard():
        return render_template('admin/index.html')
    
    @app.route('/student')
    def student_dashboard():
        return render_template('student/index.html')
    
    @app.route('/verifier')
    def verifier_dashboard():
        return render_template('verifier/index.html')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "ok",
            "message": "Server is running",
            "database": "connected"
        })
    

    
    # Initialize database
    with app.app_context():
        db.create_all()
        # Create default admin if not exists
        from backend.models import Admin
        from backend.utils.helpers import hash_password
        
        admin = Admin.query.filter_by(username='admin').first()
        if not admin:
            admin = Admin(
                admin_id='ADMIN-001',
                username='admin',
                email='admin@kletech.ac.in',
                password_hash=hash_password('admin123'),
                full_name='System Administrator',
                role='issuer'
            )
            db.session.add(admin)
            db.session.commit()

        # Sync Faculty Admins from Contineo
        from backend.services.contineo_service import ContineoService
        try:
            print("Syncing Faculty Admins from Contineo...")
            faculty_list = ContineoService.get_all_faculty()
            for faculty in faculty_list:
                if faculty.get("is_admin"):
                    f_id = faculty.get("faculty_id")
                    if not Admin.query.get(f_id) and not Admin.query.filter_by(username=f_id).first():
                        print(f"Provisioning Faculty Admin: {f_id}")
                        new_fac_admin = Admin(
                            admin_id=f_id,
                            username=f_id,
                            email=faculty.get("email"),
                            password_hash=hash_password(faculty.get("password", "password123")),
                            full_name=f"{faculty.get('first_name')} {faculty.get('last_name')}",
                            role='issuer'
                        )
                        db.session.add(new_fac_admin)
            db.session.commit()
        except Exception as e:
            print(f"Startup Faculty Sync Warning: {e}")
            db.session.rollback()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

