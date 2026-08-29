from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import University, Etablissement, User, Abonnement, ActivityLog
from .serializers import (
    UserSerializer, UserCreateSerializer,
    UniversitySerializer, EtablissementSerializer,
    AbonnementSerializer, ActivityLogSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdmin


class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data['refresh'])
            # Log the logout
            ActivityLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=ActivityLog.Action.LOGOUT,
                description="Déconnexion",
                university=request.user.university if request.user.is_authenticated else None,
            )
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')
        if not request.user.check_password(old_password):
            return Response({'error': 'Mot de passe actuel incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'error': 'Le nouveau mot de passe doit contenir au moins 6 caractères.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'})


# ── Université ──

class UniversityListView(generics.ListCreateAPIView):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]


class UniversityDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    permission_classes = [IsAdmin]


# ── Établissement ──

class EtablissementListView(generics.ListCreateAPIView):
    serializer_class = EtablissementSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Etablissement.objects.select_related('university')
        univ_id = self.request.query_params.get('university')
        if univ_id:
            qs = qs.filter(university_id=univ_id)
        return qs


class EtablissementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Etablissement.objects.select_related('university')
    serializer_class = EtablissementSerializer
    permission_classes = [IsAdmin]


# ── Utilisateurs ──

class UserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related('university', 'etablissement')
        if user.university_id:
            qs = qs.filter(university=user.university)
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        etab = self.request.query_params.get('etablissement')
        if etab:
            qs = qs.filter(etablissement_id=etab)
        return qs.order_by('role', 'nom')

    def perform_create(self, serializer):
        user = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user,
            action=ActivityLog.Action.CREATE_USER,
            description=f"Création du compte {user.login} (rôle : {user.role})",
            university=self.request.user.university,
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserCreateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.university_id:
            return User.objects.filter(university=user.university)
        return User.objects.all()

    def perform_update(self, serializer):
        obj = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user,
            action=ActivityLog.Action.UPDATE_USER,
            description=f"Modification du compte {obj.login}",
            university=self.request.user.university,
        )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action=ActivityLog.Action.DELETE_USER,
            description=f"Suppression du compte {instance.login} (rôle : {instance.role})",
            university=self.request.user.university,
        )
        instance.delete()


# ── Abonnements ──

class AbonnementListView(generics.ListAPIView):
    serializer_class = AbonnementSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return Abonnement.objects.select_related('university').all()


class AbonnementDetailView(generics.RetrieveUpdateAPIView):
    queryset = Abonnement.objects.select_related('university')
    serializer_class = AbonnementSerializer
    permission_classes = [IsAdmin]


class AbonnementEnsureView(APIView):
    """Create or retrieve an abonnement for a given university."""
    permission_classes = [IsAdmin]

    def post(self, request):
        univ_id = request.data.get('university')
        if not univ_id:
            return Response({'error': 'university required'}, status=400)
        try:
            university = University.objects.get(pk=univ_id)
        except University.DoesNotExist:
            return Response({'error': 'University not found'}, status=404)
        ab, _ = Abonnement.objects.get_or_create(university=university)
        return Response(AbonnementSerializer(ab).data)


# ── Activity Logs ──

class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = ActivityLog.objects.select_related('user', 'university')
        action = self.request.query_params.get('action')
        if action:
            qs = qs.filter(action=action)
        univ = self.request.query_params.get('university')
        if univ:
            qs = qs.filter(university_id=univ)
        user_q = self.request.query_params.get('user')
        if user_q:
            qs = qs.filter(user__login__icontains=user_q)
        return qs[:500]


# ── Admin Stats ──

class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        week_ago = today - timedelta(days=7)

        universities   = University.objects.count()
        etablissements = Etablissement.objects.count()
        users_total    = User.objects.filter(is_active=True).count()
        abonnements    = Abonnement.objects.count()
        abonnes_actifs = Abonnement.objects.filter(statut='actif').count()

        connexions_today = ActivityLog.objects.filter(
            action=ActivityLog.Action.LOGIN,
            created_at__date=today,
        ).count()
        connexions_yesterday = ActivityLog.objects.filter(
            action=ActivityLog.Action.LOGIN,
            created_at__date=yesterday,
        ).count()

        # Connexions 7 derniers jours
        connexions_week = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            cnt = ActivityLog.objects.filter(
                action=ActivityLog.Action.LOGIN,
                created_at__date=day,
            ).count()
            connexions_week.append({'date': day.isoformat(), 'count': cnt})

        # Users par rôle
        users_by_role = list(
            User.objects.values('role').annotate(count=Count('id')).order_by('-count')
        )

        # Logs récents
        recent_logs = ActivityLogSerializer(
            ActivityLog.objects.select_related('user', 'university')[:10], many=True
        ).data

        return Response({
            'universities':    universities,
            'etablissements':  etablissements,
            'users_total':     users_total,
            'abonnements':     abonnements,
            'abonnes_actifs':  abonnes_actifs,
            'connexions_today': connexions_today,
            'connexions_yesterday': connexions_yesterday,
            'connexions_week': connexions_week,
            'users_by_role':   users_by_role,
            'recent_logs':     recent_logs,
        })
