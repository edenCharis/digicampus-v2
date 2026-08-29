from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import University, Etablissement, User


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = ['id', 'code', 'libelle', 'logo', 'email_contact', 'tel_contact', 'ville']


class EtablissementSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.libelle', read_only=True)

    class Meta:
        model = Etablissement
        fields = ['id', 'code', 'libelle', 'university', 'university_name', 'logo', 'email', 'tel', 'ville']


class UserSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.libelle', read_only=True)
    etablissement_name = serializers.CharField(source='etablissement.libelle', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'login', 'nom', 'email', 'photo', 'role',
            'university', 'university_name', 'etablissement', 'etablissement_name',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    university_name = serializers.CharField(source='university.libelle', read_only=True)
    etablissement_name = serializers.CharField(source='etablissement.libelle', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'login', 'nom', 'email', 'role', 'password',
            'university', 'university_name', 'etablissement', 'etablissement_name',
            'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'login'

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': user.id,
            'login': user.login,
            'nom': user.nom,
            'role': user.role,
            'university': user.university_id,
            'university_name': user.university.libelle if user.university else None,
            'etablissement': user.etablissement_id,
            'etablissement_name': user.etablissement.libelle if user.etablissement else None,
            'photo': user.photo.url if user.photo else None,
        }
        return data
