from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import University, Etablissement, User


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'ville', 'created_at']
    search_fields = ['code', 'libelle']


@admin.register(Etablissement)
class EtablissementAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'university', 'ville']
    list_filter = ['university']
    search_fields = ['code', 'libelle']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['login', 'nom', 'role', 'university', 'etablissement', 'is_active']
    list_filter = ['role', 'university', 'is_active']
    search_fields = ['login', 'nom', 'email']
    fieldsets = (
        (None, {'fields': ('login', 'password')}),
        ('Informations', {'fields': ('nom', 'email', 'photo', 'role')}),
        ('Tenant', {'fields': ('university', 'etablissement')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('login', 'password1', 'password2', 'role', 'university', 'etablissement'),
        }),
    )
    ordering = ['login']
