"""
Run: python seed.py
Crée l'université de démo, l'établissement FIT, et un utilisateur par rôle.
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'digicampus.settings')
django.setup()

from accounts.models import University, Etablissement, User

# ── Université ──
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
print(f'✔ University : {univ}')

# ── Établissement ──
etab, _ = Etablissement.objects.get_or_create(
    university=univ,
    code='FIT',
    defaults={
        'libelle': "Faculté des Sciences et Technologies de l'Information",
        'email': 'fit@udsn.cg',
        'ville': 'Kintélé',
    },
)
print(f'✔ Etablissement : {etab}')

# ── Utilisateurs par rôle ──
# login = role (sans accent), mot de passe = Campus@2024!
ROLES = [
    ('admin',        'admin',        'Super Administrateur',   User.Role.ADMIN,       True,  True),
    ('scolarite',    'scolarite',    'Agent Scolarité',        User.Role.SCOLARITE,   False, False),
    ('doyen',        'doyen',        'Doyen FIT',              User.Role.DOYEN,       False, False),
    ('enseignant',   'enseignant',   'Enseignant Demo',        User.Role.ENSEIGNANT,  False, False),
    ('professeur',   'professeur',   'Professeur Demo',        User.Role.PROFESSEUR,  False, False),
    ('cours',        'cours',        'Agent Cours',            User.Role.COURS,       False, False),
    ('inscription',  'inscription',  'Agent Inscription',      User.Role.INSCRIPTION, False, False),
    ('anonymat',     'anonymat',     'Agent Anonymat',         User.Role.ANONYMAT,    False, False),
    ('daarhspe',     'daarhspe',     'Agent DAARHSPE',         User.Role.DAARHSPE,    False, False),
    ('gesnote',      'gesnote',      'Agent Gestion Notes',    User.Role.GESNOTE,     False, False),
    ('soutenance',   'soutenance',   'Agent Soutenance',       User.Role.SOUTENANCE,  False, False),
    ('suivi',        'suivi',        'Agent Suivi',            User.Role.SUIVI,       False, False),
    ('caisse',       'caisse',       'Agent Caisse',           User.Role.CAISSE,      False, False),
    ('pvd',          'pvd',          'Agent PVD',              User.Role.PVD,         False, False),
]

PASSWORD = 'Campus@2024!'

print('\n── Création des comptes ──')
for login, _, nom, role, is_staff, is_superuser in ROLES:
    if User.objects.filter(login=login).exists():
        print(f'  (existe déjà) {login}')
        continue
    u = User(
        login=login, nom=nom, role=role,
        university=univ, etablissement=etab,
        is_active=True, is_staff=is_staff, is_superuser=is_superuser,
    )
    u.set_password(PASSWORD if login != 'admin' else 'Admin@123!')
    u.save()
    print(f'  ✔ créé : {login}')

print('\n── Identifiants ──')
print(f'  {"LOGIN":<15} {"MOT DE PASSE":<15} ROLE')
print(f'  {"-"*50}')
for login, _, nom, role, _, _ in ROLES:
    pwd = 'Admin@123!' if login == 'admin' else PASSWORD
    print(f'  {login:<15} {pwd:<15} {role}')
