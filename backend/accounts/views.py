from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import University, Etablissement, User
from .serializers import (
    UserSerializer, UniversitySerializer, EtablissementSerializer,
    CustomTokenObtainPairSerializer,
)


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


class UniversityListView(generics.ListCreateAPIView):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class EtablissementListView(generics.ListCreateAPIView):
    serializer_class = EtablissementSerializer

    def get_queryset(self):
        qs = Etablissement.objects.select_related('university')
        univ_id = self.request.query_params.get('university')
        if univ_id:
            qs = qs.filter(university_id=univ_id)
        return qs


class UserListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN and not user.etablissement:
            return User.objects.filter(university=user.university)
        return User.objects.filter(etablissement=user.etablissement)
