from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone, timedelta

db = SQLAlchemy()

IST = timezone(timedelta(hours=5, minutes=30))


def get_ist_now():
    utc_now = datetime.now(timezone.utc)
    ist_now = utc_now.astimezone(IST)
    return ist_now.replace(tzinfo=None)


def format_ist_time(dt):
    if dt is None:
        return None
    
    if dt.tzinfo is None:
        return dt.strftime("%d/%m/%Y %I:%M:%S %p IST")
    else:
        ist_dt = dt.astimezone(IST)
        return ist_dt.strftime("%d/%m/%Y %I:%M:%S %p IST")


class Phone(db.Model):
    __tablename__ = "phones"

    id = db.Column(db.Integer, primary_key=True)
    brand = db.Column(db.String(100), nullable=False, index=True)
    model_name = db.Column(db.String(200), nullable=False, index=True)
    condition = db.Column(db.String(50), nullable=False)
    storage = db.Column(db.String(50))
    color = db.Column(db.String(50))
    base_price = db.Column(db.Float, nullable=False)
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    discontinued = db.Column(db.Boolean, default=False)

    tags = db.Column(db.String(300), default="")

    manual_overrides = db.Column(db.JSON, nullable=True)

    created_at = db.Column(db.DateTime, default=get_ist_now)
    updated_at = db.Column(db.DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "brand": self.brand,
            "model_name": self.model_name,
            "condition": self.condition,
            "storage": self.storage,
            "color": self.color,
            "base_price": self.base_price,
            "stock_quantity": self.stock_quantity,
            "discontinued": self.discontinued,
            "tags": self.get_tags(),
            "manual_overrides": self.manual_overrides or {},
            "created_at": format_ist_time(self.created_at),
            "updated_at": format_ist_time(self.updated_at),
        }

    def get_tags(self) -> list[str]:
        return [t.strip() for t in self.tags.split(",") if t.strip()] if self.tags else []

    def set_tags(self, tags: list[str]):
        self.tags = ",".join(tags)


class ListingLog(db.Model):
    __tablename__ = "listing_logs"

    id = db.Column(db.Integer, primary_key=True)
    phone_id = db.Column(db.Integer, db.ForeignKey("phones.id"), nullable=False)
    platform = db.Column(db.String(20), nullable=False)
    success = db.Column(db.Boolean, nullable=False)
    message = db.Column(db.String(500))
    attempted_price = db.Column(db.Float)
    fee = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=get_ist_now)

    phone = db.relationship("Phone", backref=db.backref("listings", lazy=True))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "phone_id": self.phone_id,
            "platform": self.platform,
            "success": self.success,
            "message": self.message,
            "attempted_price": self.attempted_price,
            "fee": self.fee,
            "created_at": format_ist_time(self.created_at),
        }
