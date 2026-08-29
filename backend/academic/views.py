from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import (
    AnneeAcademique, Specialite, Classe, UE, Etudiant, Inscription,
)
from .serializers import (
    AnneeAcademiqueSerializer, SpecialiteSerializer, ClasseSerializer,
    UESerializer, EtudiantSerializer, InscriptionSerializer,
)
from accounts.models import User, University, Etablissement


def scoped_qs(request, qs):
    user = request.user
    if user.etablissement_id:
        return qs.filter(etablissement=user.etablissement)
    if user.university_id:
        return qs.filter(etablissement__university=user.university)
    return qs


class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user

        if user.etablissement_id:
            etab_ids = [user.etablissement_id]
        elif user.university_id:
            etab_ids = list(
                Etablissement.objects.filter(university=user.university).values_list('id', flat=True)
            )
        else:
            etab_ids = list(Etablissement.objects.values_list('id', flat=True))

        etudiants = Etudiant.objects.filter(etablissement_id__in=etab_ids).count()
        classes = Classe.objects.filter(etablissement_id__in=etab_ids).count()
        ues = UE.objects.filter(etablissement_id__in=etab_ids).count()

        annee_active = AnneeAcademique.objects.filter(
            etablissement_id__in=etab_ids, is_active=True
        ).first()
        inscriptions = (
            Inscription.objects.filter(annee=annee_active).count()
            if annee_active else 0
        )

        univs = University.objects.filter(
            id=user.university_id
        ).count() if user.university_id else University.objects.count()

        etabs = Etablissement.objects.filter(id__in=etab_ids).count()

        users_count = User.objects.filter(
            university=user.university
        ).count() if user.university_id else User.objects.count()

        return Response({
            'universites': univs,
            'etablissements': etabs,
            'utilisateurs': users_count,
            'etudiants': etudiants,
            'classes': classes,
            'ues': ues,
            'inscriptions': inscriptions,
            'annee_active': annee_active.libelle if annee_active else None,
        })


class AnneeListView(generics.ListCreateAPIView):
    serializer_class = AnneeAcademiqueSerializer

    def get_queryset(self):
        return scoped_qs(self.request, AnneeAcademique.objects.all())


class SpecialiteListView(generics.ListCreateAPIView):
    serializer_class = SpecialiteSerializer

    def get_queryset(self):
        return scoped_qs(self.request, Specialite.objects.select_related('cycle'))


class ClasseListView(generics.ListCreateAPIView):
    serializer_class = ClasseSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['libelle', 'niveau']

    def get_queryset(self):
        return scoped_qs(self.request, Classe.objects.select_related('specialite'))


class UEListView(generics.ListCreateAPIView):
    serializer_class = UESerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'libelle']

    def get_queryset(self):
        qs = scoped_qs(
            self.request,
            UE.objects.select_related('specialite').prefetch_related('ecues'),
        )
        specialite = self.request.query_params.get('specialite')
        if specialite:
            qs = qs.filter(specialite_id=specialite)
        return qs


class UEDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UESerializer

    def get_queryset(self):
        return scoped_qs(self.request, UE.objects.prefetch_related('ecues'))


class EtudiantListView(generics.ListCreateAPIView):
    serializer_class = EtudiantSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['matricule', 'nom', 'prenom', 'email']

    def get_queryset(self):
        return scoped_qs(self.request, Etudiant.objects.all())


class EtudiantDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EtudiantSerializer

    def get_queryset(self):
        return scoped_qs(self.request, Etudiant.objects.all())


class InscriptionListView(generics.ListCreateAPIView):
    serializer_class = InscriptionSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['etudiant__matricule', 'etudiant__nom', 'etudiant__prenom']

    def get_queryset(self):
        qs = Inscription.objects.select_related('etudiant', 'classe', 'annee')
        user = self.request.user
        if user.etablissement_id:
            qs = qs.filter(etudiant__etablissement=user.etablissement)
        elif user.university_id:
            qs = qs.filter(etudiant__etablissement__university=user.university)
        annee = self.request.query_params.get('annee')
        if annee:
            qs = qs.filter(annee_id=annee)
        classe = self.request.query_params.get('classe')
        if classe:
            qs = qs.filter(classe_id=classe)
        return qs
