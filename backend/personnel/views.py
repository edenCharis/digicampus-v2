from rest_framework import generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import PERSONNEL
from .models import Departement, Agent, Conge
from .serializers import DepartementSerializer, AgentSerializer, CongeSerializer


class PersonnelPermission(IsAuthenticated):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user.role in ('administrateur', 'scolarité', PERSONNEL)
        return request.user.role in ('administrateur', PERSONNEL)


def _agent_qs(request):
    qs = Agent.objects.select_related('departement')
    user = request.user
    if user.etablissement_id:
        qs = qs.filter(etablissement=user.etablissement)
    elif user.university_id:
        qs = qs.filter(etablissement__university=user.university)
    return qs


def _dep_qs(request):
    qs = Departement.objects.all()
    user = request.user
    if user.etablissement_id:
        qs = qs.filter(etablissement=user.etablissement)
    elif user.university_id:
        qs = qs.filter(etablissement__university=user.university)
    return qs


# ── Stats ─────────────────────────────────────────────────────────────────────

class PersonnelStatsView(APIView):
    permission_classes = [PersonnelPermission]

    def get(self, request):
        agents = _agent_qs(request)
        conges = Conge.objects.filter(agent__in=agents)
        deps   = _dep_qs(request)
        return Response({
            'total':             agents.count(),
            'actifs':            agents.filter(statut='actif').count(),
            'en_conge':          agents.filter(statut='conge').count(),
            'departements':      deps.count(),
            'conges_en_attente': conges.filter(statut='en_attente').count(),
        })


# ── Départements ──────────────────────────────────────────────────────────────

class DepartementListView(generics.ListCreateAPIView):
    serializer_class = DepartementSerializer
    permission_classes = [PersonnelPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'code']

    def get_queryset(self):
        return _dep_qs(self.request)

    def perform_create(self, serializer):
        user = self.request.user
        if user.etablissement_id:
            serializer.save(etablissement=user.etablissement)
        else:
            serializer.save()


class DepartementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DepartementSerializer
    permission_classes = [PersonnelPermission]

    def get_queryset(self):
        return _dep_qs(self.request)


# ── Agents ────────────────────────────────────────────────────────────────────

class AgentListView(generics.ListCreateAPIView):
    serializer_class = AgentSerializer
    permission_classes = [PersonnelPermission]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom', 'prenom', 'email', 'poste']

    def get_queryset(self):
        qs = _agent_qs(self.request)
        dep    = self.request.query_params.get('departement')
        statut = self.request.query_params.get('statut')
        if dep:
            qs = qs.filter(departement=dep)
        if statut:
            qs = qs.filter(statut=statut)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.etablissement_id:
            serializer.save(etablissement=user.etablissement)
        else:
            serializer.save()


class AgentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AgentSerializer
    permission_classes = [PersonnelPermission]

    def get_queryset(self):
        return _agent_qs(self.request)


# ── Congés ────────────────────────────────────────────────────────────────────

class CongeListView(generics.ListCreateAPIView):
    serializer_class = CongeSerializer
    permission_classes = [PersonnelPermission]

    def get_queryset(self):
        qs = Conge.objects.select_related('agent')
        user = self.request.user
        if user.etablissement_id:
            qs = qs.filter(agent__etablissement=user.etablissement)
        elif user.university_id:
            qs = qs.filter(agent__etablissement__university=user.university)
        agent  = self.request.query_params.get('agent')
        statut = self.request.query_params.get('statut')
        if agent:
            qs = qs.filter(agent=agent)
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class CongeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CongeSerializer
    permission_classes = [PersonnelPermission]

    def get_queryset(self):
        qs = Conge.objects.select_related('agent')
        user = self.request.user
        if user.etablissement_id:
            qs = qs.filter(agent__etablissement=user.etablissement)
        return qs
