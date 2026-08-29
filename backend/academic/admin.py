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
    list_display = ['code', 'nom', 'prenom', 'sexe', 'statut', 'email', 'etablissement']
    list_filter = ['etablissement', 'sexe', 'statut']
    search_fields = ['code', 'nom', 'prenom', 'email']


@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = ['etudiant', 'classe', 'annee', 'type_inscription', 'statut_paiement', 'est_valide', 'date_inscription']
    list_filter = ['annee', 'type_inscription', 'est_valide', 'statut_paiement']
    search_fields = ['etudiant__code', 'etudiant__nom']


admin.site.register(Cycle)
admin.site.register(TypeDiplome)
