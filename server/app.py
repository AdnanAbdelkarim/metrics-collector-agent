from flask import Flask
from flask_cors import CORS
from server.routes.metrics import metrics_bp
from server.config.server_config import ServerConfig

def create_app():
    app = Flask(__name__)
    
    # Allow all origins (for dev)
    CORS(app)

    # Register blueprints
    app.register_blueprint(metrics_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host=ServerConfig.HOST, port=ServerConfig.PORT, debug=ServerConfig.DEBUG)
