# Blind Bazaar
Tugas Individu 2 PBP oleh Adam Rayyan Aryasatya (NPM 2406496031)

## Link Deployment PWS
http://adam-rayyan-blindbazaar.pbp.cs.ui.ac.id/

### Step-by-step *Checklist* Implementasi
#### Membuat sebuah proyek Django baru.

-   Membuat *virtual environment* Python dengan perintah `python -m venv env`, dan mengaktifkannya dengan perintah `env\Scripts\activate`.
-   Membuat file `requirements.txt` yang berisi *dependencies* untuk menjalankan appnya (*copy-paste* list dependencies pada Tutorial 0).
-   Buat project Django baru dengan perintah `django-admin start project blind_bazaar .`.

#### Membuat aplikasi dengan nama *main* pada proyek tersebut.

-   Jalankan perintah `python manage.py startapp main`.
-   Jangan lupa tambahkan `'main'` ke `INSTALLED_APPS` pada `blind_bazaar/settings.py`.
    ```py
    INSTALLED_APPS = [
        # other stuff
        'main',
    ]
    ```
#### Melakukan *routing* pada proyek agar dapat menjalankan aplikasi `main`.
-   Tambahkan *modules-modules* di bawah ini pada `blind_bazaar/urls.py`
    ```py
    from django.urls import path, include
    ```
-   Tambahkan URL app `main`
    ```py
    path('', include('main.urls'))
    ```
    Baris ini akan mengarahkan request untuk `http://<url>/` ke `main`.


#### Membuat model pada aplikasi `main` dengan nama `Product` dan memiliki atribut wajib sebagai berikut.

-   Buat model baru dengan nama `Product` pada `main/models.py` dan tambahkan atribut yang sesuai
    ```py
    import uuid
    from django.db import models

    class Product(models.Model):
        CATEGORY_CHOICES = [
            # truncated
        ]

        RARITY_CHOICES = [
            # truncated
        ]

        id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
        name = models.CharField(max_length=255, unique=True)
        # ... tambahkan atribut-atribut lainnya

        def __str__(self):
            return f"{self.name} ({self.rarity} {self.category})"
    ```

#### Membuat sebuah fungsi pada `views.py` untuk dikembalikan ke dalam sebuah *template* HTML yang menampilkan nama aplikasi serta nama dan kelas kamu.

-   Buat fungsi `show_index` pada `main/views.py` yang menerima `request` sebagai parameter.
-   Pada fungsi tersebut buatlah sebuah dictionary yang berisi value yang ingin disubstitusi ke dalam *template* `main.html` (contohnya seperti `{{ name }}` maka buat dictionary entry dengan key `name`)
    ```py
    from django.shortcuts import render

    def show_index(request):
        context = {
            'npm': '2406496031',
            'name': 'Adam Rayyan Aryasatya',
            'class': 'PBP A',
        }
        return render(request, 'main.html', context)
    ```

#### Membuat sebuah routing pada `urls.py` aplikasi main untuk memetakan fungsi yang telah dibuat pada `views.py`.

-   Buat file `main/urls.py` dan tambahkan baris-baris di bawah ini:
    ```py
    from django.urls import path
    from .views import show_index

    urlpatterns = [
        path('', show_index, name='index'),
    ]
    ```
    Baris-baris tersebut berfungsi untuk memetakan path `''` kepada `show_index` yang akan menampilkan `main.html`.
-   Tambahkan URL app `main` pada `blind_bazaar/urls.py`
    ```py
    from django.contrib import admin
    from django.urls import path, include

    urlpatterns = [
        path('admin/', admin.site.urls),
        path('', include('main.urls')),
    ]
    ```
    Hasilnya semua request kepada *site root* (`/`) akan didelegasikan kepada *URL patterns* yang ada di `main/urls.py`.


#### Melakukan *deployment* ke PWS terhadap aplikasi yang sudah dibuat sehingga nantinya dapat diakses oleh teman-temanmu melalui Internet.

-   Pada website PWS, buatlah sebuah project (jangan lupa simpan kredensial).
-   Konfigurasi *environment variables* yang ada di `.env.prod`.
-   Push branch `master` kepada *remote repository* PWS.
-   Sekarang website bisa diakses pada http://adam-rayyan-blindbazaar.pbp.cs.ui.ac.id/.


### Bagan Request Client

![Bagan](assets/diagram.png)


### Peran `settings.py` dalam proyek Django
File settings.py adalah pusat konfigurasi untuk proyek Django. Semua pengaturan utama proyek disimpan di sini agar framework tahu bagaimana aplikasi dijalankan. 

- `INSTALLED_APPS`: daftar aplikasi yang diaktifkan (termasuk `main`).
- `DATABASES`: konfigurasi database (SQLite dev / PostgreSQL prod).
- `TEMPLATES`: loader template (APP_DIRS, DIRS, context processors).
- `STATIC_URL` (+ `STATICFILES_DIRS`/`STATIC_ROOT` saat deploy): file statis.
- `MIDDLEWARE`: middleware per-request.
- `ALLOWED_HOSTS`, `DEBUG`, `SECRET_KEY`: keamanan & mode pengembangan.
- `ROOT_URLCONF`, `WSGI_APPLICATION`/`ASGI_APPLICATION`: entry routing & server.

### Cara kerja migrasi database di Django

Setiap kali ada perubahan pada `models.py`, perlu adanya proses migrasi. Migrasi di Django merupkaan mekanisme untuk menjaga sinkronisasi antara model Python dengan struktur tabel di database. Alur migrasi pada Django seperti berikut:
-   Melakukan beberapa pengubahan model di  `models.py`.
-   Membuat migrasi dengan perintah `python manage.py makemigrations`. Django akan menganalisis perubahan model dan membuat file migrasi yang berisi instruksi untuk mengubah database.
-   Menerapkan migrasi dengan perintah `python manage.py migrate`. Django menjalankan instruksi migrasi tadi untuk membuat/mengubah tabel, kolom, constraint, dsb.


### Alasan framework Django bagus untuk dijadikan permulaan pembelajaran 

Django sering dijadikan permulaan pembelajaran pengembangan perangkat lunak karena sifatnya yang lengkap dan terstruktur. Django sudah menyediakan banyak fitur bawaan seperti autentikasi, ORM, hingga admin panel sehingga pemula tidak perlu repot membangun semuanya dari awal. Selain itu, Django menerapkan prinsip pengembangan perangkat lunak modern seperti "*Don’t Repeat Yourself*" dan yang melatih pemula untuk menulis kode dengan rapi dan konsisten. Dengan kombinasi fitur bawaan yang kuat, struktur proyek yang jelas, dan *best practices* yang diajarkan sejak awal, Django menjadi pilihan ideal sebagai framework pertama untuk memahami pengembangan perangkat lunak dari awal.


### Feedback Tutorial 1

Sejauh ini belum ada, tutorial 0 dan 1 berjalan dengan baik.