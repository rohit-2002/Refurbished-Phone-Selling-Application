import os
from flask import Flask, request, redirect, url_for, flash, jsonify
from models import db, Phone, ListingLog
from forms import PhoneForm
from utils import import_phones_from_csv, sanitize_string
from platform_mock import simulate_listing
from pricing import calculate_platform_price, map_condition_for_platform
from flask_wtf.csrf import CSRFProtect
from functools import wraps

basedir = os.path.abspath(os.path.dirname(__file__))


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or "dev-secret-key"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(basedir, "phone_inventory.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    csrf = CSRFProtect(app)

    @app.after_request
    def after_request(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-ADMIN,X-CSRFToken')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def handle_options(path):
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-ADMIN')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response

    with app.app_context():
        db.create_all()

    def admin_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            is_admin = request.args.get("admin") == "1" or request.headers.get("X-ADMIN") == "1"
            if not is_admin:
                if request.path.startswith("/api/"):
                    return jsonify({"error": "Admin access required"}), 403
                flash("Admin access required (append ?admin=1)", "warning")
                return redirect(url_for("index"))
            return f(*args, **kwargs)
        return decorated

    @app.route("/")
    def index():
        q = sanitize_string(request.args.get("q") or "")
        cond = sanitize_string(request.args.get("condition") or "")

        phones = Phone.query
        if q:
            phones = phones.filter(
                (Phone.model_name.ilike(f"%{q}%")) | (Phone.brand.ilike(f"%{q}%"))
            )
        if cond:
            phones = phones.filter_by(condition=cond)
        phones = phones.all()

        return jsonify([phone.to_dict() for phone in phones])

    @app.route("/admin")
    @admin_required
    def admin():
        phones = Phone.query.order_by(Phone.id.desc()).all()
        return jsonify([phone.to_dict() for phone in phones])

    @app.route("/phone/add", methods=["POST"])
    @admin_required
    def add_phone():
        form = PhoneForm()
        if form.validate_on_submit():
            phone = Phone(
                model_name=form.model_name.data.strip(),
                brand=form.brand.data.strip(),
                condition=form.condition.data,
                storage=form.storage.data.strip(),
                color=form.color.data.strip(),
                base_price=float(form.base_price.data),
                stock_quantity=int(form.stock_quantity.data),
                discontinued=bool(form.discontinued.data),
                tags=form.tags.data.strip()
            )
            db.session.add(phone)
            db.session.commit()
            return jsonify({"success": True, "phone": phone.to_dict()}), 201
        return jsonify({"error": "Invalid form data"}), 400

    @app.route("/phone/<int:phone_id>/edit", methods=["PUT"])
    @admin_required
    def edit_phone(phone_id):
        phone = Phone.query.get_or_404(phone_id)
        data = request.get_json() or {}
        for field in ["model_name", "brand", "condition", "storage", "color", "tags"]:
            if field in data:
                setattr(phone, field, data[field])
        if "base_price" in data:
            phone.base_price = float(data["base_price"])
        if "stock_quantity" in data:
            phone.stock_quantity = int(data["stock_quantity"])
        if "discontinued" in data:
            phone.discontinued = bool(data["discontinued"])
        db.session.commit()
        return jsonify(phone.to_dict())

    @app.route("/phone/<int:phone_id>/delete", methods=["DELETE"])
    @admin_required
    def delete_phone(phone_id):
        phone = Phone.query.get_or_404(phone_id)
        db.session.delete(phone)
        db.session.commit()
        return jsonify({"success": True}), 204

    @app.route("/bulk_upload", methods=["POST"])
    @csrf.exempt
    def bulk_upload():
        if not (request.args.get("admin") == "1" or request.headers.get("X-ADMIN") == "1"):
            return jsonify({"error": "Admin access required"}), 403

        f = request.files.get("file")
        if not f:
            return jsonify({"error": "No file uploaded"}), 400

        try:
            created, errors = import_phones_from_csv(f)
            message = f"Successfully imported {len(created)} phones"
            if errors:
                message += f" with {len(errors)} errors"
            return jsonify({
                "success": True,
                "message": message,
                "created_count": len(created),
                "error_count": len(errors),
                "errors": errors[:10]
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/bulk_upload", methods=["POST"])
    @csrf.exempt
    @admin_required
    def api_bulk_upload():
        f = request.files.get("file")
        if not f:
            return jsonify({"error": "No file uploaded"}), 400

        try:
            created, errors = import_phones_from_csv(f)
            return jsonify({
                "success": True,
                "created_count": len(created),
                "error_count": len(errors),
                "errors": errors[:10]
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/list/<int:phone_id>/<platform>", methods=["POST"])
    @csrf.exempt
    def list_phone(phone_id, platform):
        if not (request.args.get("admin") == "1" or request.headers.get("X-ADMIN") == "1"):
            return jsonify({"error": "Admin access required"}), 403

        phone = Phone.query.get_or_404(phone_id)
        if phone.stock_quantity <= 0:
            msg = "Cannot list: out of stock"
            log = ListingLog(phone_id=phone.id, platform=platform, success=False, message=msg)
            db.session.add(log)
            db.session.commit()
            return jsonify({"success": False, "message": msg}), 400

        try:
            override_price = request.form.get("override_price")
            if override_price:
                try:
                    override_price = float(override_price)
                    phone.manual_overrides = phone.manual_overrides or {}
                    phone.manual_overrides[platform] = override_price
                    db.session.commit()
                except (ValueError, TypeError):
                    return jsonify({"success": False, "message": "Invalid override price"}), 400

            override = (phone.manual_overrides or {}).get(platform)
            if override:
                final, fee = calculate_platform_price(phone.base_price, platform)
                msg = f"Listed with manual override ${override:.2f} on {platform}"
                log = ListingLog(phone_id=phone.id, platform=platform, success=True,
                                 message=msg, attempted_price=override, fee=fee)
                db.session.add(log)
                db.session.commit()
                return jsonify({"success": True, "message": msg, "price": override, "override": True}), 200

            success, msg, final_price, fee = simulate_listing(phone, platform)
            log = ListingLog(phone_id=phone.id, platform=platform, success=success,
                             message=msg, attempted_price=final_price, fee=fee)
            db.session.add(log)
            db.session.commit()
            return jsonify({"success": success, "message": msg, "price": final_price, "fee": fee, "override": False}), (200 if success else 400)

        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": str(e)}), 500

    @app.route("/api/phones", methods=["GET"])
    def api_phones():
        return jsonify([p.to_dict() for p in Phone.query.all()])

    @app.route("/api/phones", methods=["POST"])
    @csrf.exempt
    @admin_required
    def api_create_phone():
        data = request.get_json() or {}
        
        try:
            required_fields = ["brand", "model_name", "condition", "base_price"]
            for field in required_fields:
                if not data.get(field):
                    return jsonify({"error": f"Missing required field: {field}"}), 400
            
            phone = Phone(
                brand=str(data["brand"]).strip(),
                model_name=str(data["model_name"]).strip(),
                condition=str(data["condition"]).strip(),
                storage=str(data.get("storage", "")).strip(),
                color=str(data.get("color", "")).strip(),
                base_price=float(data["base_price"]),
                stock_quantity=int(data.get("stock_quantity", 0)),
                discontinued=bool(data.get("discontinued", False)),
                tags=str(data.get("tags", "")).strip()
            )
            
            db.session.add(phone)
            db.session.commit()
            return jsonify({"success": True, "phone": phone.to_dict()}), 201
            
        except (ValueError, TypeError) as e:
            db.session.rollback()
            return jsonify({"error": f"Invalid data: {str(e)}"}), 400
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route("/api/phones/<int:phone_id>", methods=["GET"])
    def api_phone(phone_id):
        return jsonify(Phone.query.get_or_404(phone_id).to_dict())

    @app.route("/api/phones/<int:phone_id>", methods=["PUT"])
    @csrf.exempt
    @admin_required
    def api_update_phone(phone_id):
        phone = Phone.query.get_or_404(phone_id)
        data = request.get_json() or {}
        
        print(f"Updating phone {phone_id} with data: {data}")
        
        try:
            for field in ["model_name", "brand", "condition", "storage", "color", "tags"]:
                if field in data and data[field] is not None:
                    setattr(phone, field, str(data[field]).strip())
            
            if "base_price" in data and data["base_price"] is not None:
                phone.base_price = float(data["base_price"])
            if "stock_quantity" in data and data["stock_quantity"] is not None:
                phone.stock_quantity = int(data["stock_quantity"])
            if "discontinued" in data:
                phone.discontinued = bool(data["discontinued"])
            
            db.session.commit()
            return jsonify({"success": True, "phone": phone.to_dict()}), 200
            
        except (ValueError, TypeError) as e:
            db.session.rollback()
            print(f"ValueError in update: {str(e)}")
            return jsonify({"error": f"Invalid data: {str(e)}"}), 400
        except Exception as e:
            db.session.rollback()
            print(f"Exception in update: {str(e)}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/phones/<int:phone_id>", methods=["DELETE"])
    @csrf.exempt
    @admin_required
    def api_delete_phone(phone_id):
        try:
            phone = Phone.query.get_or_404(phone_id)
            
            ListingLog.query.filter_by(phone_id=phone_id).delete()
            db.session.delete(phone)
            db.session.commit()
            return jsonify({"success": True, "message": f"Phone {phone_id} deleted successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route("/api/logs", methods=["GET"])
    def api_logs():
        if not (request.args.get("admin") == "1" or request.headers.get("X-ADMIN") == "1"):
            return jsonify({"error": "Admin access required"}), 403
        logs = ListingLog.query.order_by(ListingLog.created_at.desc()).limit(200).all()
        return jsonify([log.to_dict() for log in logs])

    @app.route("/api/phones/<int:phone_id>/price/<platform>", methods=["GET"])
    def api_phone_price(phone_id, platform):
        phone = Phone.query.get_or_404(phone_id)
        
        override = (phone.manual_overrides or {}).get(platform)
        if override:
            return jsonify({
                "price": override,
                "fee": 0,
                "override": True
            })
        
        try:
            final_price, fee = calculate_platform_price(phone.base_price, platform)
            return jsonify({
                "price": final_price,
                "fee": fee,
                "override": False
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route("/api/update-prices", methods=["POST"])
    @csrf.exempt
    @admin_required
    def api_update_prices():
        try:
            phones = Phone.query.all()
            updated_count = 0
            
            for phone in phones:
                if phone.base_price > 0:
                    updated_count += 1
            db.session.commit()
            
            return jsonify({
                "success": True,
                "updated_count": updated_count,
                "message": f"Price calculations refreshed for {updated_count} phones"
            }), 200
            
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route("/api/test-time", methods=["GET"])
    def test_time():
        from models import get_ist_now, format_ist_time
        from datetime import datetime, timezone
        
        current = get_ist_now()
        utc_now = datetime.now(timezone.utc)
        
        return jsonify({
            "ist_raw": str(current),
            "ist_formatted": format_ist_time(current),
            "utc_time": str(utc_now),
            "hour_24": current.hour,
            "hour_12": current.strftime("%I %p"),
            "timezone_info": "IST (UTC+5:30)"
        })

    return app

if __name__ == "__main__":
    app = create_app()
    print("🚀 Running Flask on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)