from flask import Flask

from .config import DevConfig
from .extensions import db, login_manager, bcrypt
from .routes.main import main_bp
from .routes.auth import auth_bp
from .routes.cart import cart_bp
from .routes.order import order_bp
from .routes.admin import admin_bp


def create_app(config_class=DevConfig):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    bcrypt.init_app(app)

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(admin_bp)

    return app
