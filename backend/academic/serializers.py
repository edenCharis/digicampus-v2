from rest_framework import serializers
from .models import (
    AnneeAcademique, Cycle, Parcours, Specialite, Classe, UE, ECUE,
    Etudiant, Inscription, Semestre, Niveau,
)


class AnneeAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnneeAcademique
        fields = ['id', 'libelle', 'is_active', 'etablissement']


class CycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = ['id', 'code', 'libelle', 'etablissement']


class ParcoursSerializer(serializers.ModelSerializer):
    etablissement_libelle = serializers.CharField(source='etablissement.libelle', read_only=True)

    class Meta:
        model = Parcours
        fields = ['id', 'code', 'libelle', 'etablissement', 'etablissement_libelle']


class SpecialiteSerializer(serializers.ModelSerializer):
    cycle_libelle   = serializers.CharField(source='cycle.libelle',   read_only=True)
    parcours_libelle = serializers.CharField(source='parcours.libelle', read_only=True)

    class Meta:
        model = Specialite
        fields = ['id', 'code', 'libelle', 'etablissement', 'cycle', 'cycle_libelle', 'parcours', 'parcours_libelle']


class SemestreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semestre
        fields = ['id', 'code', 'libelle', 'ordre', 'etablissement']


class NiveauSerializer(serializers.ModelSerializer):
    class Meta:
        model = Niveau
        fields = ['id', 'code', 'libelle', 'ordre', 'etablissement']


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
    specialite_libelle = serializers.CharField(source='specialite.libelle', read_only=True)

    class Meta:
        model = Etudiant
        fields = [
            'id', 'code', 'nom', 'prenom', 'nom_complet',
            'sexe', 'date_nais', 'lieu_nais', 'nationalite',
            'email', 'tel', 'photo',
            'bac', 'moyenne_bac', 'annee_bac', 'mention', 'cycle',
            'specialite', 'specialite_libelle',
            'statut', 'statut_paiement_inscription', 'statut_paiement_concours',
            'etat', 'date_candidature', 'etablissement', 'created_at',
        ]
        read_only_fields = ['id', 'code', 'nom_complet', 'date_candidature', 'created_at']


class EtudiantListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour la liste (sans les détails bac)."""
    specialite_libelle = serializers.CharField(source='specialite.libelle', read_only=True)

    class Meta:
        model = Etudiant
        fields = [
            'id', 'code', 'nom', 'prenom', 'sexe', 'email', 'tel',
            'statut', 'specialite_libelle', 'statut_paiement_inscription',
            'etat', 'date_candidature',
        ]


class InscriptionSerializer(serializers.ModelSerializer):
    etudiant_nom = serializers.CharField(source='etudiant.nom_complet', read_only=True)
    etudiant_code = serializers.CharField(source='etudiant.code', read_only=True)
    etudiant_sexe = serializers.CharField(source='etudiant.sexe', read_only=True)
    classe_libelle = serializers.CharField(source='classe.libelle', read_only=True)
    classe_niveau = serializers.CharField(source='classe.niveau', read_only=True)
    annee_libelle = serializers.CharField(source='annee.libelle', read_only=True)

    class Meta:
        model = Inscription
        fields = [
            'id', 'etudiant', 'etudiant_nom', 'etudiant_code', 'etudiant_sexe',
            'classe', 'classe_libelle', 'classe_niveau',
            'annee', 'annee_libelle', 'etablissement',
            'type_inscription', 'statut_paiement', 'montant_paye',
            'date_inscription', 'est_valide',
        ]


class InscriptionCreateSerializer(serializers.Serializer):
    """
    Crée un Etudiant + une Inscription en une seule opération atomique —
    miroir exact du double INSERT du Digital Campus original :
      INSERT INTO candidat (...)
      INSERT INTO inscription (candidat, classe, annee, etab, statut_paiement)
    """
    # Infos étudiant
    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    sexe = serializers.ChoiceField(choices=Etudiant.Sexe.choices, default='M')
    date_nais = serializers.DateField(required=False, allow_null=True)
    lieu_nais = serializers.CharField(max_length=100, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    tel = serializers.CharField(max_length=30, required=False, allow_blank=True)
    nationalite = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bac = serializers.ChoiceField(choices=Etudiant.Bac.choices, required=False, allow_blank=True)
    moyenne_bac = serializers.FloatField(required=False, allow_null=True)
    annee_bac = serializers.CharField(max_length=4, required=False, allow_blank=True)
    mention = serializers.ChoiceField(choices=Etudiant.Mention.choices, required=False, allow_blank=True)
    cycle = serializers.CharField(max_length=50, required=False, allow_blank=True)
    specialite = serializers.PrimaryKeyRelatedField(queryset=Specialite.objects.all(), required=False, allow_null=True)

    # Inscription
    classe = serializers.PrimaryKeyRelatedField(queryset=Classe.objects.all())
    annee = serializers.PrimaryKeyRelatedField(queryset=AnneeAcademique.objects.all())
    etablissement = serializers.PrimaryKeyRelatedField(queryset=__import__('accounts.models', fromlist=['Etablissement']).Etablissement.objects.all())
    type_inscription = serializers.ChoiceField(choices=Inscription.TypeInscription.choices, default='nouveau')
    statut_paiement = serializers.BooleanField(default=False)
    montant_paye = serializers.DecimalField(max_digits=12, decimal_places=0, default=0)

    def validate(self, data):
        # Vérifier que la spécialité de la classe correspond
        classe = data.get('classe')
        specialite = data.get('specialite')
        if classe and specialite and classe.specialite != specialite:
            raise serializers.ValidationError(
                {'specialite': 'La spécialité ne correspond pas à celle de la classe choisie.'}
            )
        return data

    def create(self, validated_data):
        from django.db import transaction
        inscription_fields = ['classe', 'annee', 'etablissement', 'type_inscription', 'statut_paiement', 'montant_paye']
        etudiant_fields = {k: v for k, v in validated_data.items() if k not in inscription_fields}
        insc_data = {k: validated_data[k] for k in inscription_fields}

        with transaction.atomic():
            etudiant = Etudiant.objects.create(**etudiant_fields, statut=Etudiant.Statut.INSCRIT)
            inscription = Inscription.objects.create(
                etudiant=etudiant,
                **insc_data,
            )
        return {'etudiant': etudiant, 'inscription': inscription}
