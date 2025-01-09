from flask import Flask
import os

def create_app():
    # Determine the absolute path to the root directory
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    app = Flask(
        __name__,
        template_folder=os.path.join(root_dir, 'templates'),
        static_folder=os.path.join(root_dir, 'static')
    )
    
    # Configuration
    app.config['UPLOAD_FOLDER'] = os.path.join(root_dir, 'uploads')
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register Blueprints
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    return app