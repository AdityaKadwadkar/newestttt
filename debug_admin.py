
from backend.app import create_app
from backend.models import db, Admin

app = create_app()

def check_admins():
    with app.app_context():
        admins = Admin.query.all()
        print(f"Total Admins: {len(admins)}")
        for admin in admins:
            print(f"ID: {admin.admin_id}, Username: {admin.username}, Role: {admin.role}, Hash Len: {len(admin.password_hash)}")

if __name__ == "__main__":
    check_admins()
