import datetime
from django.core import serializers
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages

from .forms import ProductForm
from .models import Product

@login_required(login_url='/login')
def show_index(request):
    filter_type = request.GET.get("filter", "all")  

    if filter_type == "all":
        products = Product.objects.all()
    else:
        products = Product.objects.filter(user=request.user)
        
    context = {
        'npm': '2406496031',
        'name': request.user.username,
        'class': 'PBP A',
        'products': products,
        'product_count': products.count(),
        'last_login': request.COOKIES.get('last_login', 'Never')
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
            messages.success(request, 'Account successfully created!')
            return redirect('main:login')
    context = {'form': form}
    return render(request, 'register.html', context)

def login_user(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)
            response = HttpResponseRedirect(reverse('main:index'))
            response.set_cookie('last_login', str(datetime.datetime.now()))
            return response
    else:
        form = AuthenticationForm(request)
    context = {'form': form}
    return render(request, 'login.html', context)

def logout_user(request):
    logout(request)
    response = HttpResponseRedirect(reverse('main:login'))
    response.delete_cookie('last_login')
    return response