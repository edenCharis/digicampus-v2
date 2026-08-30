from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import AcademicReadPermission, EtudiantPermission, IsAdminOrScolarite, IsAdmin
from .models import (
    AnneeAcademique, Cycle, Parcours, Specialite, Classe, UE, ECUE, Etudiant, Inscription,
)
from .serializers import (
    AnneeAcademiqueSerializer, CycleSerializer, ParcoursSerializer, SpecialiteSerializer,
    ClasseSerializer, UESerializer, ECUESerializer, EtudiantSerializer, EtudiantListSerializer,
    InscriptionSerializer, InscriptionCreateSerializer,
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
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = scoped_qs(self.request, AnneeAcademique.objects.all())
        etab = self.request.query_params.get('etablissement')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        return qs


class AnneeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnneeAcademiqueSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, AnneeAcademique.objects.all())

    def perform_update(self, serializer):
        # Si on active cette année, désactiver les autres du même établissement
        instance = serializer.save()
        if instance.is_active:
            AnneeAcademique.objects.filter(
                etablissement=instance.etablissement,
                is_active=True,
            ).exclude(pk=instance.pk).update(is_active=False)


class CycleListView(generics.ListCreateAPIView):
    serializer_class = CycleSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Cycle.objects.all())


class CycleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CycleSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Cycle.objects.all())


class ParcoursListView(generics.ListCreateAPIView):
    serializer_class = ParcoursSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = scoped_qs(self.request, Parcours.objects.select_related('etablissement'))
        etab = self.request.query_params.get('etablissement')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        return qs


class ParcoursDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ParcoursSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Parcours.objects.select_related('etablissement'))


class SpecialiteListView(generics.ListCreateAPIView):
    serializer_class = SpecialiteSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = scoped_qs(self.request, Specialite.objects.select_related('cycle', 'parcours'))
        etab = self.request.query_params.get('etablissement')
        parcours = self.request.query_params.get('parcours')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        if parcours:
            qs = qs.filter(parcours_id=parcours)
        return qs


class SpecialiteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SpecialiteSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Specialite.objects.select_related('cycle', 'parcours'))


class ClasseListView(generics.ListCreateAPIView):
    serializer_class = ClasseSerializer
    permission_classes = [AcademicReadPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['libelle', 'niveau']

    def get_queryset(self):
        qs = scoped_qs(self.request, Classe.objects.select_related('specialite'))
        niveau = self.request.query_params.get('niveau')
        if niveau:
            qs = qs.filter(niveau=niveau)
        specialite = self.request.query_params.get('specialite')
        if specialite:
            qs = qs.filter(specialite_id=specialite)
        return qs


class UEListView(generics.ListCreateAPIView):
    serializer_class = UESerializer
    permission_classes = [AcademicReadPermission]
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
        niveau = self.request.query_params.get('niveau')
        if niveau:
            qs = qs.filter(niveau=niveau)
        semestre = self.request.query_params.get('semestre')
        if semestre:
            qs = qs.filter(semestre=semestre)
        return qs


class UEDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UESerializer

    def get_queryset(self):
        return scoped_qs(self.request, UE.objects.prefetch_related('ecues'))


class EtudiantListView(generics.ListCreateAPIView):
    permission_classes = [EtudiantPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['code', 'nom', 'prenom', 'email']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return EtudiantListSerializer
        return EtudiantSerializer

    def get_queryset(self):
        qs = scoped_qs(self.request, Etudiant.objects.select_related('specialite'))
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class EtudiantDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EtudiantSerializer
    permission_classes = [EtudiantPermission]

    def get_queryset(self):
        return scoped_qs(self.request, Etudiant.objects.all())


class ECUEListView(generics.ListCreateAPIView):
    serializer_class = ECUESerializer

    def get_queryset(self):
        qs = ECUE.objects.select_related('ue')
        ue_id = self.request.query_params.get('ue')
        if ue_id:
            qs = qs.filter(ue_id=ue_id)
        return qs


class ECUEDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ECUESerializer
    queryset = ECUE.objects.all()


class ClasseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClasseSerializer

    def get_queryset(self):
        return scoped_qs(self.request, Classe.objects.select_related('specialite'))


class InscriptionListView(generics.ListAPIView):
    serializer_class = InscriptionSerializer
    permission_classes = [EtudiantPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etudiant__code', 'etudiant__nom', 'etudiant__prenom']

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
        type_insc = self.request.query_params.get('type')
        if type_insc:
            qs = qs.filter(type_inscription=type_insc)
        return qs


class InscriptionCreateView(APIView):
    """POST: crée un étudiant + son inscription en un seul appel atomique."""
    permission_classes = [EtudiantPermission]

    def post(self, request):
        serializer = InscriptionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response({
            'etudiant': EtudiantSerializer(result['etudiant']).data,
            'inscription': InscriptionSerializer(result['inscription']).data,
        }, status=status.HTTP_201_CREATED)


class ReinscriptionView(APIView):
    """Réinscrit un étudiant existant dans une nouvelle classe/année."""
    permission_classes = [EtudiantPermission]

    def post(self, request):
        from django.db import transaction
        etudiant_id = request.data.get('etudiant')
        classe_id = request.data.get('classe')
        annee_id = request.data.get('annee')

        try:
            etudiant = Etudiant.objects.get(pk=etudiant_id)
            classe = Classe.objects.get(pk=classe_id)
            annee = AnneeAcademique.objects.get(pk=annee_id)
        except (Etudiant.DoesNotExist, Classe.DoesNotExist, AnneeAcademique.DoesNotExist) as e:
            return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)

        if Inscription.objects.filter(etudiant=etudiant, annee=annee).exists():
            return Response(
                {'detail': 'Cet étudiant est déjà inscrit pour cette année académique.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            inscription = Inscription.objects.create(
                etudiant=etudiant,
                classe=classe,
                annee=annee,
                etablissement=classe.etablissement,
                type_inscription='reinscrit',
                statut_paiement=request.data.get('statut_paiement', False),
                montant_paye=request.data.get('montant_paye', 0),
            )
            etudiant.statut = Etudiant.Statut.INSCRIT
            etudiant.save(update_fields=['statut'])

        return Response({
            'etudiant': EtudiantSerializer(etudiant).data,
            'inscription': InscriptionSerializer(inscription).data,
        }, status=status.HTTP_201_CREATED)
