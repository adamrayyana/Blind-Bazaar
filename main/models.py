import uuid
from django.db import models

# Create your models here.
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('joker', 'Joker'),
        ('tarot', 'Tarot Card'),
        ('spectral', 'Spectral Card'),
        ('planet', 'Planet Card'),
        ('voucher', 'Voucher'),
        ('pack', 'Booster Pack'),
    ]

    RARITY_CHOICES = [
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('legendary', 'Legendary'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    price  = models.IntegerField()
    description = models.TextField()
    thumbnail = models.URLField(blank=True, null=True)
    category = models.CharField(choices=CATEGORY_CHOICES, max_length=31)
    rarity = models.CharField(choices=RARITY_CHOICES, max_length=31, default='common')
    created_at = models.DateTimeField(auto_now_add=True)
    is_featured = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.rarity} {self.category})"