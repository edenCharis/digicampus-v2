from django.contrib import admin
from .models import (
    AnneeAcademique, Cycle, Specialite, Classe,
    UE, ECUE, Etudiant, Inscription, TypeDiplome,
)


@admin.register(AnneeAcademique)
class AnneeAdmin(admin.ModelAdmin):
    list_display = ['libelle', 'etablissement', 'is_active']
    list_filter = ['etablissement', 'is_active']


@admin.register(Specialite)
class SpecialiteAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'etablissement', 'cycle']
    list_filter = ['etablissement']
    search_fields = ['code', 'libelle']


@admin.register(Classe)
class ClasseAdmin(admin.ModelAdmin):
    list_display = ['libelle', 'niveau', 'specialite', 'effectif', 'etablissement']
    list_filter = ['etablissement', 'niveau']
    search_fields = ['libelle']


@admin.register(UE)
class UEAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'semestre', 'niveau', 'specialite', 'credits']
    list_filter = ['etablissement', 'semestre', 'niveau']
    search_fields = ['code', 'libelle']


@admin.register(ECUE)
class ECUEAdmin(admin.ModelAdmin):
    list_display = ['code', 'libelle', 'ue', 'credits', 'coefficient']
    search_fields = ['code', 'libelle']


@admin.register(Etudiant)
class EtudiantAdmin(admin.ModelAdmin):
    list_display = ['matricule', 'nom', 'prenom', 'sexe', 'email', 'etablissement']
    list_filter = ['etablissement', 'sexe']
    search_fields = ['matricule', 'nom', 'prenom', 'email']


@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = ['etudiant', 'classe', 'annee', 'statut', 'est_valide', 'date_inscription']
    list_filter = ['annee', 'statut', 'est_valide']
    search_fields = ['etudiant__matricule', 'etudiant__nom']


admin.site.register(Cycle)
admin.site.register(TypeDiplome)
