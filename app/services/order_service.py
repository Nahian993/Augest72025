"""Business logic for order operations."""

from ..models import Order
from ..extensions import db


def create_order(user, total):
    order = Order(user_id=user.id, total=total)
    db.session.add(order)
    db.session.commit()
    return order
