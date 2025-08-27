import csv
import re
from io import StringIO
from models import db, Phone


def sanitize_string(value):
    if not value:
        return ""
    sanitized = re.sub(r'[<>"\';\\]', '', str(value))
    return sanitized[:100]


def import_phones_from_csv(file):
    created = []
    errors = []
    
    try:
        content = file.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8')
        
        csv_reader = csv.DictReader(StringIO(content))
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                required_fields = ['brand', 'model_name', 'condition', 'base_price']
                for field in required_fields:
                    if not row.get(field, '').strip():
                        raise ValueError(f"Missing required field: {field}")
                
                phone = Phone(
                    brand=sanitize_string(row['brand'].strip()),
                    model_name=sanitize_string(row['model_name'].strip()),
                    condition=sanitize_string(row['condition'].strip()),
                    storage=sanitize_string(row.get('storage', '').strip()),
                    color=sanitize_string(row.get('color', '').strip()),
                    base_price=float(row['base_price']),
                    stock_quantity=int(row.get('stock_quantity', 0)),
                    discontinued=str(row.get('discontinued', 'false')).lower() in ['true', '1', 'yes'],
                    tags=sanitize_string(row.get('tags', '').strip())
                )
                
                if phone.base_price <= 0:
                    raise ValueError("Base price must be greater than 0")
                if phone.stock_quantity < 0:
                    raise ValueError("Stock quantity cannot be negative")
                
                db.session.add(phone)
                created.append(phone)
                
            except (ValueError, TypeError) as e:
                errors.append(f"Row {row_num}: {str(e)}")
            except Exception as e:
                errors.append(f"Row {row_num}: Unexpected error - {str(e)}")
        
        if not errors:
            db.session.commit()
        else:
            db.session.rollback()
            
    except Exception as e:
        db.session.rollback()
        errors.append(f"File processing error: {str(e)}")
    
    return created, errors