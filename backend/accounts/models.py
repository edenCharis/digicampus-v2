from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager


class University(models.Model):
    code = models.CharField(max_length=20, unique=True)
    libelle = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    email_contact = models.EmailField(blank=True)
    tel_contact = models.CharField(max_length=30, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    departement = models.CharField(max_length=100, blank=True)
    fax = models.CharField(max_length=30, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Universities'
        ordering = ['libelle']

    def __str__(self):
        return self.libelle


class Etablissement(models.Model):
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name='etablissements')
    code = models.CharField(max_length=20)
    libelle = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='etab_logos/', blank=True, null=True)
    email = models.EmailField(blank=True)
    tel = models.CharField(max_length=30, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('university', 'code')
        ordering = ['libelle']

    def __str__(self):
        return f"{self.libelle} ({self.university.code})"


class UserManager(BaseUserManager):
    def create_user(self, login, password=None, **extra_fields):
        if not login:
            raise ValueError('Login is required')
        user = self.model(login=login, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, password=None, **extra_fields):
        extra_fields.setdefault('role', User.Role.ADMIN)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(login, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'administrateur', 'Administrateur'
        SCOLARITE = 'scolarité', 'Scolarité'
        DOYEN = 'doyen', 'Doyen'
        ENSEIGNANT = 'enseignant', 'Enseignant'
        PROFESSEUR = 'professeur', 'Professeur'
        COURS = 'cours', 'Cours'
        INSCRIPTION = 'inscription', 'Inscription'
        ANONYMAT = 'anonymat', 'Anonymat'
        DAARHSPE = 'daarhspe', 'DAARHSPE'
        GESNOTE = 'gesnote', 'Gestion des Notes'
        SOUTENANCE = 'soutenance', 'Soutenance'
        SUIVI = 'suivi', 'Suivi'
        CAISSE = 'caisse', 'Caisse'
        PVD = 'pvd', 'PVD'

    login = models.CharField(max_length=100, unique=True)
    nom = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.SCOLARITE)
    university = models.ForeignKey(University, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    etablissement = models.ForeignKey(Etablissement, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    token_activation = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.login} ({self.role})"
