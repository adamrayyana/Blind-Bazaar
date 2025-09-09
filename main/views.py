from django.shortcuts import render

def show_index(request):
    context = {
        'npm': '2406496031',
        'name': 'Adam Rayyan Aryasatya',
        'class': 'PBP A',
    }
    return render(request, 'main.html', context)
