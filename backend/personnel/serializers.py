from rest_framework import serializers
from .models import Departement, Agent, Conge


class DepartementSerializer(serializers.ModelSerializer):
    nb_agents = serializers.SerializerMethodField()

    class Meta:
        model = Departement
        fields = ['id', 'code', 'nom', 'description', 'etablissement', 'nb_agents']

    def get_nb_agents(self, obj):
        return obj.agents.filter(statut='actif').count()


class AgentSerializer(serializers.ModelSerializer):
    departement_nom  = serializers.CharField(source='departement.nom', read_only=True)
    statut_display   = serializers.CharField(source='get_statut_display', read_only=True)
    contrat_display  = serializers.CharField(source='get_type_contrat_display', read_only=True)
    nom_complet      = serializers.CharField(read_only=True)

    class Meta:
        model = Agent
        fields = [
            'id', 'nom', 'prenom', 'nom_complet', 'sexe', 'email', 'tel',
            'poste', 'type_contrat', 'contrat_display',
            'departement', 'departement_nom',
            'date_embauche', 'salaire',
            'statut', 'statut_display',
            'etablissement', 'created_at',
        ]
        read_only_fields = ['id', 'nom_complet', 'created_at']


class CongeSerializer(serializers.ModelSerializer):
    agent_nom      = serializers.CharField(source='agent.nom_complet', read_only=True)
    agent_poste    = serializers.CharField(source='agent.poste', read_only=True)
    type_display   = serializers.CharField(source='get_type_conge_display', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    nb_jours       = serializers.IntegerField(read_only=True)

    class Meta:
        model = Conge
        fields = [
            'id', 'agent', 'agent_nom', 'agent_poste',
            'type_conge', 'type_display',
            'date_debut', 'date_fin', 'nb_jours',
            'motif', 'statut', 'statut_display', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
