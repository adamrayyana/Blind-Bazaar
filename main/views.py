import datetime
import json
from typing import Any, Dict

from django.core import serializers
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.urls import reverse
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.views.decorators.http import require_http_methods

from .forms import ProductForm
from .models import Product

@login_required(login_url='/login')
def show_index(request):
    context = {
        'npm': '2406496031',
        'name': request.user.username,
        'class': 'PBP A',
        'last_login': request.COOKIES.get('last_login', 'Never'),
    }
    return render(request, 'main.html', context)

@login_required(login_url='/login')
def create_product(request):
    form = ProductForm(request.POST or None)
    if form.is_valid():
        product_entry = form.save(commit=False)
        product_entry.user = request.user
        product_entry.save()
        return redirect('main:product_detail', product_entry.id)
    
    context = {'form': form}
    return render(request, 'product_form.html', context)

@login_required(login_url='/login')
def show_product_detail(request, id):
    product = get_object_or_404(Product, pk=id)
    context = {'product': product}
    return render(request, 'product_detail.html', context)

# --- AJAX helpers --------------------------------------------------------- #

def _is_ajax(request) -> bool:
    return request.headers.get('x-requested-with') == 'XMLHttpRequest'


def _serialize_product(product: Product, *, current_user) -> Dict[str, Any]:
    return {
        'id': str(product.id),
        'name': product.name,
        'price': product.price,
        'description': product.description,
        'category': product.category,
        'category_label': product.get_category_display(),
        'rarity': product.rarity,
        'rarity_label': product.get_rarity_display(),
        'thumbnail': product.thumbnail,
        'is_featured': product.is_featured,
        'created_at': product.created_at.isoformat() if product.created_at else None,
        'owner_username': product.user.username if product.user else None,
        'owner_id': product.user_id,
        'is_owner': current_user.is_authenticated and product.user_id == current_user.id,
    }


def _normalize_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    normalized: Dict[str, Any] = {}
    for key, value in payload.items():
        if isinstance(value, bool):
            normalized[key] = 'on' if value else ''
        elif value is None:
            normalized[key] = ''
        else:
            normalized[key] = str(value)
    return normalized


def _extract_json(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


@login_required(login_url='/login')
@require_http_methods(['GET', 'POST'])
def products_collection(request):
    if request.method == 'GET':
        filter_type = request.GET.get('filter', 'all')
        queryset = Product.objects.all().order_by('-created_at')
        if filter_type == 'my':
            queryset = queryset.filter(user=request.user)
        data = [_serialize_product(product, current_user=request.user) for product in queryset]
        return JsonResponse({'items': data}, status=200)

    payload = _extract_json(request)
    if payload is None:
        return JsonResponse({'message': 'Invalid JSON payload'}, status=400)

    form_data = _normalize_payload(payload)
    form = ProductForm(form_data)
    if form.is_valid():
        product = form.save(commit=False)
        product.user = request.user
        product.save()
        return JsonResponse(
            {'item': _serialize_product(product, current_user=request.user)},
            status=201,
        )

    return JsonResponse({'errors': form.errors}, status=400)


@login_required(login_url='/login')
@require_http_methods(['GET', 'PUT', 'PATCH', 'DELETE'])
def product_resource(request, id):
    product = get_object_or_404(Product, pk=id)

    if request.method == 'GET':
        return JsonResponse({'item': _serialize_product(product, current_user=request.user)}, status=200)

    if product.user_id != request.user.id:
        return JsonResponse({'message': 'You do not have permission to modify this product.'}, status=403)

    if request.method == 'DELETE':
        product.delete()
        return JsonResponse({'message': 'Product deleted successfully.'}, status=200)

    payload = _extract_json(request)
    if payload is None:
        return JsonResponse({'message': 'Invalid JSON payload'}, status=400)

    form_data = _normalize_payload(payload)
    form = ProductForm(form_data, instance=product)
    if form.is_valid():
        updated_product = form.save()
        return JsonResponse({'item': _serialize_product(updated_product, current_user=request.user)}, status=200)

    return JsonResponse({'errors': form.errors}, status=400)

@login_required(login_url='/login')
def edit_product(request, id):
    product = get_object_or_404(Product, pk=id, user=request.user)
    form = ProductForm(request.POST or None, instance=product)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect('main:product_detail', product.id)
    context = { 'form': form }
    return render(request, "edit_product.html", context)

@login_required(login_url='/login')
def delete_product(request, id):
    product = get_object_or_404(Product, pk=id)
    product.delete()
    return HttpResponseRedirect(reverse('main:index'))

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

def register(request):
    form = UserCreationForm()

    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            success_message = 'Account successfully created!'
            if _is_ajax(request):
                return JsonResponse(
                    {
                        'message': success_message,
                        'redirect': reverse('main:login'),
                    },
                    status=201,
                )
            messages.success(request, success_message)
            return redirect('main:login')
        if _is_ajax(request):
            return JsonResponse({'errors': form.errors}, status=400)
    context = {'form': form}
    return render(request, 'register.html', context)

def login_user(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)
            response = HttpResponseRedirect(reverse('main:index'))
            response.set_cookie('last_login', str(datetime.datetime.now()))
            if _is_ajax(request):
                ajax_response = JsonResponse(
                    {
                        'message': 'Login successful.',
                        'redirect': reverse('main:index'),
                    },
                    status=200,
                )
                ajax_response.set_cookie('last_login', str(datetime.datetime.now()))
                return ajax_response
            return response
        if _is_ajax(request):
            return JsonResponse({'errors': form.errors}, status=400)
    else:
        form = AuthenticationForm(request)
    context = {'form': form}
    return render(request, 'login.html', context)

def logout_user(request):
    logout(request)
    if _is_ajax(request):
        response = JsonResponse({'message': 'Logged out successfully.', 'redirect': reverse('main:login')})
    else:
        response = HttpResponseRedirect(reverse('main:login'))
    response.delete_cookie('last_login')
    return response
