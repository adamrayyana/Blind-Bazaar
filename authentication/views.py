from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.forms import UserCreationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({'status': False, 'message': 'Invalid request method.'}, status=405)

    username = request.POST.get('username')
    password = request.POST.get('password')
    if not username or not password:
        return JsonResponse(
            {'status': False, 'message': 'Username and password are required.'},
            status=400,
        )

    user = authenticate(username=username, password=password)
    if user is not None:
        if user.is_active:
            auth_login(request, user)
            return JsonResponse(
                {
                    "username": user.username,
                    "status": True,
                    "message": "Login successful!",
                },
                status=200,
            )
        return JsonResponse(
            {"status": False, "message": "Login failed, account is disabled."},
            status=401,
        )

    return JsonResponse(
        {"status": False, "message": "Login failed, please check your username or password."},
        status=401,
    )


@csrf_exempt
def logout(request):
    username = request.user.username if request.user.is_authenticated else None
    try:
        auth_logout(request)
        return JsonResponse(
            {"username": username, "status": True, "message": "Logged out successfully!"},
            status=200,
        )
    except Exception:
        return JsonResponse({"status": False, "message": "Logout failed."}, status=401)


@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'status': False, 'message': 'Invalid request method.'}, status=405)

    form = UserCreationForm(request.POST)
    if form.is_valid():
        form.save()
        return JsonResponse({"status": True, "message": "Register successful!"}, status=201)

    return JsonResponse(
        {
            "status": False,
            "message": "Register failed.",
            "errors": form.errors,
        },
        status=400,
    )
