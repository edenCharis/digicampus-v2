"""
Run: python seed.py
Creates the default super-admin and a demo university/etablissement.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digicampus.settings')
django.setup()

from accounts.models import University, Etablissement, User

univ, _ = University.objects.get_or_create(
    code='UDSN',
    defaults={
        'libelle': "Université Denis Sassou N'Guesso",
        'email_contact': 'contact@udsn.cg',
        'tel_contact': '+242 06 000 0000',
        'ville': 'Kintélé',
        'departement': 'Brazzaville',
    },
)
print(f'University: {univ}')

etab, _ = Etablissement.objects.get_or_create(
    university=univ,
    code='FIT',
    defaults={
        'libelle': 'Faculté des Sciences et Technologies de l\'Information',
        'email': 'fit@udsn.cg',
        'ville': 'Kintélé',
    },
)
print(f'Etablissement: {etab}')

if not User.objects.filter(login='admin').exists():
    User.objects.create_superuser(
        login='admin',
        password='Admin@123!',
        nom='Super Administrateur',
        role=User.Role.ADMIN,
        university=univ,
        is_staff=True,
        is_superuser=True,
    )
    print('Superuser admin created (password: Admin@123!)')
else:
    print('Superuser admin already exists')
