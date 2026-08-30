from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.permissions import AcademicReadPermission, EtudiantPermission, IsAdminOrScolarite, IsAdmin
from .models import (
    AnneeAcademique, Cycle, Parcours, Specialite, Classe, UE, ECUE, Etudiant, Inscription,
    Semestre, Niveau, PaiementScolarite,
)
from .serializers import (
    AnneeAcademiqueSerializer, CycleSerializer, ParcoursSerializer, SpecialiteSerializer,
    ClasseSerializer, UESerializer, ECUESerializer, EtudiantSerializer, EtudiantListSerializer,
    InscriptionSerializer, InscriptionCreateSerializer, SemestreSerializer, NiveauSerializer,
    PaiementScolariteSerializer,
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

        from django.db.models import Count, Q

        etudiants_qs = Etudiant.objects.filter(etablissement_id__in=etab_ids)
        classes_qs   = Classe.objects.filter(etablissement_id__in=etab_ids)
        ues          = UE.objects.filter(etablissement_id__in=etab_ids).count()

        annee_active = AnneeAcademique.objects.filter(
            etablissement_id__in=etab_ids, is_active=True
        ).first()

        insc_qs = (
            Inscription.objects.filter(annee=annee_active)
            if annee_active else Inscription.objects.none()
        )

        univs = University.objects.filter(
            id=user.university_id
        ).count() if user.university_id else University.objects.count()

        etabs = Etablissement.objects.filter(id__in=etab_ids).count()

        users_count = User.objects.filter(
            university=user.university
        ).count() if user.university_id else User.objects.count()

        # Breakdown inscriptions by type
        type_counts = {
            row['type_inscription']: row['cnt']
            for row in insc_qs.values('type_inscription').annotate(cnt=Count('id'))
        }

        # Suivi paiements scolarite — période courante (mois en cours)
        from datetime import date as _date
        today = _date.today()
        periode_mois = today.strftime('%Y-%m')          # ex: "2026-08"
        sem = 'S1' if today.month <= 6 else 'S2'
        periode_sem  = f"{today.year}-{sem}"            # ex: "2026-S2"

        pai_qs_mois = PaiementScolarite.objects.filter(
            etablissement_id__in=etab_ids, periode=periode_mois
        )
        pai_qs_sem = PaiementScolarite.objects.filter(
            etablissement_id__in=etab_ids, periode=periode_sem
        )

        # Nombre total d'inscrits actifs (année active) pour calculer le taux
        inscrits_total = insc_qs.count()

        suivi_mois = {
            'periode': periode_mois,
            'paye':    pai_qs_mois.filter(statut='paye').count(),
            'partiel': pai_qs_mois.filter(statut='partiel').count(),
            'attente': pai_qs_mois.filter(statut='attente').count(),
            'total':   inscrits_total,
        }
        suivi_sem = {
            'periode': periode_sem,
            'paye':    pai_qs_sem.filter(statut='paye').count(),
            'partiel': pai_qs_sem.filter(statut='partiel').count(),
            'attente': pai_qs_sem.filter(statut='attente').count(),
            'total':   inscrits_total,
        }

        # Students by statut
        statut_counts = {
            row['statut']: row['cnt']
            for row in etudiants_qs.values('statut').annotate(cnt=Count('id'))
        }

        # Classes by niveau
        niveaux_counts = [
            {'niveau': row['niveau'], 'count': row['cnt']}
            for row in classes_qs.values('niveau').annotate(cnt=Count('id')).order_by('niveau')
        ]

        # Recent inscriptions (last 8)
        recent = []
        for insc in insc_qs.select_related('etudiant', 'classe').order_by('-date_inscription')[:8]:
            recent.append({
                'id': insc.id,
                'etudiant_nom': f"{insc.etudiant.nom} {insc.etudiant.prenom}",
                'etudiant_code': insc.etudiant.code,
                'classe': insc.classe.libelle,
                'type': insc.type_inscription,
                'paiement': insc.statut_paiement,
                'date': str(insc.date_inscription),
            })

        return Response({
            'universites': univs,
            'etablissements': etabs,
            'utilisateurs': users_count,
            'etudiants': etudiants_qs.count(),
            'classes': classes_qs.count(),
            'ues': ues,
            'inscriptions': insc_qs.count(),
            'annee_active': annee_active.libelle if annee_active else None,
            # Enriched
            'inscriptions_nouveau':    type_counts.get('nouveau', 0),
            'inscriptions_reinscrit':  type_counts.get('reinscrit', 0),
            'inscriptions_transfert':  type_counts.get('transfert', 0),
            'suivi_mois':              suivi_mois,
            'suivi_semestre':          suivi_sem,
            'etudiants_inscrit':       statut_counts.get('inscrit', 0),
            'etudiants_en_cours':      statut_counts.get('en cours', 0),
            'etudiants_admis':         statut_counts.get('admis', 0),
            'etudiants_refuse':        statut_counts.get('refusé', 0),
            'niveaux': niveaux_counts,
            'recent_inscriptions': recent,
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
        qs = scoped_qs(self.request, Cycle.objects.all())
        etab = self.request.query_params.get('etablissement')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        return qs


class CycleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CycleSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Cycle.objects.all())


class SemestreListView(generics.ListCreateAPIView):
    serializer_class = SemestreSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = scoped_qs(self.request, Semestre.objects.all())
        etab = self.request.query_params.get('etablissement')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        return qs


class SemestreDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SemestreSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Semestre.objects.all())


class NiveauListView(generics.ListCreateAPIView):
    serializer_class = NiveauSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = scoped_qs(self.request, Niveau.objects.all())
        etab = self.request.query_params.get('etablissement')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        return qs


class NiveauDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NiveauSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return scoped_qs(self.request, Niveau.objects.all())


class PaiementScolariteListView(generics.ListCreateAPIView):
    serializer_class = PaiementScolariteSerializer
    permission_classes = [IsAdminOrScolarite]

    def get_queryset(self):
        qs = scoped_qs(self.request, PaiementScolarite.objects.select_related('etudiant', 'annee'))
        periode = self.request.query_params.get('periode')
        statut  = self.request.query_params.get('statut')
        annee   = self.request.query_params.get('annee')
        if periode: qs = qs.filter(periode=periode)
        if statut:  qs = qs.filter(statut=statut)
        if annee:   qs = qs.filter(annee_id=annee)
        return qs


class PaiementScolariteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PaiementScolariteSerializer
    permission_classes = [IsAdminOrScolarite]

    def get_queryset(self):
        return scoped_qs(self.request, PaiementScolarite.objects.select_related('etudiant', 'annee'))


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
