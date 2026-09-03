from django.db import models
from accounts.models import Etablissement


class Departement(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='departements')
    code          = models.CharField(max_length=20)
    nom           = models.CharField(max_length=150)
    description   = models.TextField(blank=True)

    class Meta:
        ordering = ['nom']
        unique_together = ('etablissement', 'code')

    def __str__(self):
        return self.nom


class Agent(models.Model):
    class Sexe(models.TextChoices):
        M = 'M', 'Masculin'
        F = 'F', 'Féminin'

    class TypeContrat(models.TextChoices):
        CDI       = 'cdi',       'CDI'
        CDD       = 'cdd',       'CDD'
        VACATAIRE = 'vacataire', 'Vacataire'
        STAGE     = 'stage',     'Stage'
        BENEVOLE  = 'benevole',  'Bénévole'

    class Statut(models.TextChoices):
        ACTIF    = 'actif',    'Actif'
        CONGE    = 'conge',    'En congé'
        SUSPENDU = 'suspendu', 'Suspendu'
        QUITTE   = 'quitte',   'A quitté'

    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='agents')
    departement   = models.ForeignKey(Departement, on_delete=models.SET_NULL, null=True, blank=True, related_name='agents')
    nom           = models.CharField(max_length=100)
    prenom        = models.CharField(max_length=100)
    sexe          = models.CharField(max_length=1, choices=Sexe.choices, default=Sexe.M)
    email         = models.EmailField(blank=True)
    tel           = models.CharField(max_length=30, blank=True)
    poste         = models.CharField(max_length=150)
    type_contrat  = models.CharField(max_length=20, choices=TypeContrat.choices, default=TypeContrat.CDI)
    date_embauche = models.DateField(null=True, blank=True)
    salaire       = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True)
    statut        = models.CharField(max_length=20, choices=Statut.choices, default=Statut.ACTIF)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.nom} {self.prenom}"

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class Conge(models.Model):
    class Type(models.TextChoices):
        ANNUEL     = 'annuel',     'Congé annuel'
        MALADIE    = 'maladie',    'Congé maladie'
        MATERNITE  = 'maternite',  'Congé maternité'
        PATERNITE  = 'paternite',  'Congé paternité'
        SANS_SOLDE = 'sans_solde', 'Sans solde'
        AUTRE      = 'autre',      'Autre'

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', 'En attente'
        APPROUVE   = 'approuve',   'Approuvé'
        REFUSE     = 'refuse',     'Refusé'

    agent      = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='conges')
    type_conge = models.CharField(max_length=20, choices=Type.choices, default=Type.ANNUEL)
    date_debut = models.DateField()
    date_fin   = models.DateField()
    motif      = models.TextField(blank=True)
    statut     = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.agent} — {self.get_type_conge_display()}"

    @property
    def nb_jours(self):
        return (self.date_fin - self.date_debut).days + 1
