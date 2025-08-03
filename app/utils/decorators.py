from functools import wraps
from flask import abort
from flask_login import current_user


def admin_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not getattr(current_user, 'is_admin', False):
            abort(403)
        return func(*args, **kwargs)

    return wrapper
