from django import forms

from .models import Product


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            'name',
            'price',
            'description',
            'category',
            'rarity',
            'thumbnail',
            'is_featured',
        ]
