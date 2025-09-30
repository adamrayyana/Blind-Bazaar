from django.urls import path
import main.views as views

app_name = 'main'

urlpatterns = [
    path('', views.show_index, name='index'),
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
    path('logout/', views.logout_user, name='logout')
]
