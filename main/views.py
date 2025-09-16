from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render

from .forms import ProductForm
from .models import Product


def show_index(request):
    products = Product.objects.all().order_by('name')
    context = {
        'npm': '2406496031',
        'name': 'Adam Rayyan Aryasatya',
        'class': 'PBP A',
        'products': products,
        'product_count': products.count(),
    }
    return render(request, 'main.html', context)


def create_product(request):
    form = ProductForm(request.POST or None)
    if form.is_valid():
        product = form.save()
        return redirect('main:product_detail', product.id)
    context = {'form': form}
    return render(request, 'product_form.html', context)


def show_product_detail(request, id):
    product = get_object_or_404(Product, pk=id)
    context = {'product': product}
    return render(request, 'product_detail.html', context)


def show_xml(request):
    data = Product.objects.all()
    return HttpResponse(serializers.serialize('xml', data), content_type='application/xml')


def show_json(request):
    data = Product.objects.all()
    return HttpResponse(serializers.serialize('json', data), content_type='application/json')


def show_xml_by_id(request, id):
    product = get_object_or_404(Product, pk=id)
    return HttpResponse(
        serializers.serialize('xml', [product]),
        content_type='application/xml',
    )

def show_json_by_id(request, id):
    product = get_object_or_404(Product, pk=id)
    return HttpResponse(
        serializers.serialize('json', [product]),
        content_type='application/json',
    )
