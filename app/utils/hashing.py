from ..extensions import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.generate_password_hash(password).decode('utf-8')


def check_password(password_hash: str, password: str) -> bool:
    return bcrypt.check_password_hash(password_hash, password)
