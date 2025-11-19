from django.urls import path
import main.views as views

app_name = 'main'

urlpatterns = [
    path('', views.show_index, name='index'),
    path('api/products/', views.products_collection, name='products_collection'),
    path('api/products/<uuid:id>/', views.product_resource, name='product_resource'),
    path('products/add/', views.create_product, name='product_add'),
    path('products/<uuid:id>/', views.show_product_detail, name='product_detail'),
    path('products/<uuid:id>/edit', views.edit_product, name='edit_product'),
    path('products/<uuid:id>/delete', views.delete_product, name='delete_product'),
    path('xml/', views.show_xml, name='show_xml'),
    path('json/', views.show_json, name='show_json'),
    path('xml/<uuid:id>/', views.show_xml_by_id, name='show_xml_by_id'),
    path('json/<uuid:id>/', views.show_json_by_id, name='show_json_by_id'),
    path('register/', views.register, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('proxy-image/', views.proxy_image, name='proxy_image'),
    path('create-flutter/', views.create_product_flutter, name='create_product_flutter'),
]
