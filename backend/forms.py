from flask_wtf import FlaskForm
from wtforms import StringField, FloatField, IntegerField, BooleanField, SelectField
from wtforms.validators import DataRequired, NumberRange, Length


class PhoneForm(FlaskForm):
    
    brand = StringField('Brand', validators=[
        DataRequired(message="Brand is required"),
        Length(max=100, message="Brand must be less than 100 characters")
    ])
    
    model_name = StringField('Model Name', validators=[
        DataRequired(message="Model name is required"),
        Length(max=200, message="Model name must be less than 200 characters")
    ])
    
    condition = SelectField('Condition', choices=[
        ('New', 'New'),
        ('Excellent', 'Excellent'),
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('As New', 'As New'),
        ('Usable', 'Usable'),
        ('Scrap', 'Scrap')
    ], validators=[DataRequired(message="Condition is required")])
    
    storage = StringField('Storage', validators=[
        Length(max=50, message="Storage must be less than 50 characters")
    ])
    
    color = StringField('Color', validators=[
        Length(max=50, message="Color must be less than 50 characters")
    ])
    
    base_price = FloatField('Base Price', validators=[
        DataRequired(message="Base price is required"),
        NumberRange(min=0.01, message="Price must be greater than 0")
    ])
    
    stock_quantity = IntegerField('Stock Quantity', validators=[
        DataRequired(message="Stock quantity is required"),
        NumberRange(min=0, message="Stock quantity cannot be negative")
    ])
    
    discontinued = BooleanField('Discontinued')
    
    tags = StringField('Tags', validators=[
        Length(max=300, message="Tags must be less than 300 characters")
    ])