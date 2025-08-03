"""Business logic for cart operations."""

from ..models import Cart


def get_cart(user):
    return Cart.query.filter_by(user_id=user.id).first()
