from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import University, Etablissement, User, Abonnement, ActivityLog


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


class AbonnementSerializer(serializers.ModelSerializer):
    university_name = serializers.CharField(source='university.libelle', read_only=True)
    university_code = serializers.CharField(source='university.code', read_only=True)
    user_count      = serializers.SerializerMethodField()

    class Meta:
        model = Abonnement
        fields = [
            'id', 'university', 'university_name', 'university_code',
            'statut', 'date_debut', 'date_fin', 'max_users',
            'modules', 'notes', 'user_count', 'updated_at',
        ]

    def get_user_count(self, obj):
        return User.objects.filter(university=obj.university).count()


class ActivityLogSerializer(serializers.ModelSerializer):
    user_login = serializers.CharField(source='user.login', read_only=True)
    user_nom   = serializers.CharField(source='user.nom', read_only=True)
    university_name = serializers.CharField(source='university.libelle', read_only=True)
    action_label    = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_login', 'user_nom',
            'action', 'action_label', 'description',
            'ip', 'university', 'university_name', 'created_at',
        ]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'login'

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        # Record login activity
        try:
            request = self.context.get('request')
            ip = None
            if request:
                x_fwd = request.META.get('HTTP_X_FORWARDED_FOR')
                ip = x_fwd.split(',')[0].strip() if x_fwd else request.META.get('REMOTE_ADDR')
            ActivityLog.objects.create(
                user=user, action=ActivityLog.Action.LOGIN,
                description=f"Connexion — rôle : {user.role}",
                ip=ip, university=user.university,
            )
        except Exception:
            pass
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
