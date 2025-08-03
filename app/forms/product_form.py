from flask_wtf import FlaskForm
from wtforms import StringField, DecimalField, IntegerField, SubmitField, TextAreaField
from wtforms.validators import DataRequired


class ProductForm(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    description = TextAreaField('Description')
    price = DecimalField('Price', validators=[DataRequired()])
    stock = IntegerField('Stock', validators=[DataRequired()])
    submit = SubmitField('Save')
