from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import University, Etablissement, User
from .serializers import (
    UserSerializer, UserCreateSerializer,
    UniversitySerializer, EtablissementSerializer,
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
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


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


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = UserCreateSerializer

    def get_queryset(self):
        user = self.request.user
        if user.university_id:
            return User.objects.filter(university=user.university)
        return User.objects.all()
