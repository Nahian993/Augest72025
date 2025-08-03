"""Business logic for product operations."""

from ..models import Product


def list_products():
    return Product.query.all()
