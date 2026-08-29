from rest_framework import serializers
from .models import (
    AnneeAcademique, Cycle, Specialite, Classe, UE, ECUE,
    Etudiant, Inscription,
)


class AnneeAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeAcademique
        fields = ['id', 'libelle', 'is_active', 'etablissement']


class CycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = ['id', 'code', 'libelle', 'etablissement']


class SpecialiteSerializer(serializers.ModelSerializer):
    cycle_libelle = serializers.CharField(source='cycle.libelle', read_only=True)

    class Meta:
        model = Specialite
        fields = ['id', 'code', 'libelle', 'etablissement', 'cycle', 'cycle_libelle']


class ClasseSerializer(serializers.ModelSerializer):
    specialite_libelle = serializers.CharField(source='specialite.libelle', read_only=True)

    class Meta:
        model = Classe
        fields = ['id', 'libelle', 'niveau', 'effectif', 'etablissement', 'specialite', 'specialite_libelle']


class ECUESerializer(serializers.ModelSerializer):
    class Meta:
        model = ECUE
        fields = ['id', 'code', 'libelle', 'credits', 'coefficient', 'ue']


class UESerializer(serializers.ModelSerializer):
    ecues = ECUESerializer(many=True, read_only=True)
    specialite_libelle = serializers.CharField(source='specialite.libelle', read_only=True)

    class Meta:
        model = UE
        fields = ['id', 'code', 'libelle', 'semestre', 'niveau', 'credits',
                  'etablissement', 'specialite', 'specialite_libelle', 'ecues']


class EtudiantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etudiant
        fields = [
            'id', 'matricule', 'nom', 'prenom', 'nom_complet',
            'sexe', 'date_naissance', 'lieu_naissance', 'nationalite',
            'email', 'tel', 'photo', 'etablissement', 'created_at',
        ]
        read_only_fields = ['id', 'nom_complet', 'created_at']


class InscriptionSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.nom_complet', read_only=True)
    etudiant_matricule = serializers.CharField(source='etudiant.matricule', read_only=True)
    classe_libelle = serializers.CharField(source='classe.libelle', read_only=True)
    annee_libelle = serializers.CharField(source='annee.libelle', read_only=True)

    class Meta:
        model = Inscription
        fields = [
            'id', 'etudiant', 'etudiant_nom', 'etudiant_matricule',
            'classe', 'classe_libelle', 'annee', 'annee_libelle',
            'statut', 'date_inscription', 'montant_paye', 'est_valide',
        ]
