import uuid
from django.db import models
from accounts.models import Etablissement


class AnneeAcademique(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='annees')
    libelle = models.CharField(max_length=20)   # e.g. "2024-2025"
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('etablissement', 'libelle')
        ordering = ['-libelle']

    def __str__(self):
        return f"{self.libelle} ({self.etablissement.code})"


class Cycle(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='cycles')
    libelle = models.CharField(max_length=100)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('etablissement', 'code')

    def __str__(self):
        return self.libelle


class Specialite(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='specialites')
    cycle = models.ForeignKey(Cycle, on_delete=models.SET_NULL, null=True, blank=True)
    libelle = models.CharField(max_length=200)
    code = models.CharField(max_length=20)

    class Meta:
        unique_together = ('etablissement', 'code')
        ordering = ['libelle']

    def __str__(self):
        return self.libelle


class Classe(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='classes')
    specialite = models.ForeignKey(Specialite, on_delete=models.CASCADE, related_name='classes')
    libelle = models.CharField(max_length=200)
    niveau = models.CharField(max_length=20)   # L1, L2, L3, M1, M2…
    effectif = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('etablissement', 'libelle')
        ordering = ['niveau', 'libelle']

    def __str__(self):
        return self.libelle


class UE(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='ues')
    specialite = models.ForeignKey(Specialite, on_delete=models.CASCADE, related_name='ues')
    code = models.CharField(max_length=20)
    libelle = models.CharField(max_length=200)
    semestre = models.CharField(max_length=10)
    niveau = models.CharField(max_length=20)
    credits = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ('etablissement', 'code')
        ordering = ['semestre', 'code']

    def __str__(self):
        return f"{self.code} — {self.libelle}"


class ECUE(models.Model):
    ue = models.ForeignKey(UE, on_delete=models.CASCADE, related_name='ecues')
    code = models.CharField(max_length=20)
    libelle = models.CharField(max_length=200)
    credits = models.PositiveSmallIntegerField(default=0)
    coefficient = models.FloatField(default=1)

    class Meta:
        unique_together = ('ue', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} — {self.libelle}"


class TypeDiplome(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='types_diplome')
    libelle = models.CharField(max_length=100)

    def __str__(self):
        return self.libelle


def generate_code():
    return uuid.uuid4().hex[:8].upper()


class Etudiant(models.Model):
    """Miroir de la table `candidat` du Digital Campus original."""

    class Sexe(models.TextChoices):
        M = 'M', 'Masculin'
        F = 'F', 'Féminin'

    class Statut(models.TextChoices):
        EN_COURS = 'en cours', 'En cours'
        ADMIS = 'admis', 'Admis'
        REFUSE = 'refusé', 'Refusé'
        INSCRIT = 'inscrit', 'Inscrit'

    class Mention(models.TextChoices):
        PASSABLE = 'Passable', 'Passable'
        ASSEZ_BIEN = 'Assez-bien', 'Assez-bien'
        BIEN = 'Bien', 'Bien'
        TRES_BIEN = 'Très-bien', 'Très-bien'

    class Bac(models.TextChoices):
        A = 'A', 'A'
        C = 'C', 'C'
        D = 'D', 'D'
        E = 'E', 'E'
        F6 = 'F6', 'F6'
        H = 'H', 'H'
        R1 = 'R1', 'R1'
        R5 = 'R5', 'R5'
        R6 = 'R6', 'R6'

    # Identifiant unique généré (équivalent du `code` dans l'original)
    code = models.CharField(max_length=20, unique=True, default=generate_code)
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='etudiants')

    # Infos personnelles
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=Sexe.choices, default=Sexe.M)
    date_nais = models.DateField(null=True, blank=True)
    lieu_nais = models.CharField(max_length=100, blank=True)
    nationalite = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    tel = models.CharField(max_length=30, blank=True)
    photo = models.ImageField(upload_to='etudiants/', blank=True, null=True)

    # Baccalauréat
    bac = models.CharField(max_length=5, choices=Bac.choices, blank=True)
    moyenne_bac = models.FloatField(null=True, blank=True)
    annee_bac = models.CharField(max_length=4, blank=True)
    mention = models.CharField(max_length=20, choices=Mention.choices, blank=True)

    # Orientation
    cycle = models.CharField(max_length=50, blank=True)   # Licence, Master, Doctorat
    specialite = models.ForeignKey(Specialite, on_delete=models.SET_NULL, null=True, blank=True, related_name='etudiants')

    # Statut de la candidature
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_COURS)
    statut_paiement_inscription = models.BooleanField(default=False)
    statut_paiement_concours = models.BooleanField(default=False)
    etat = models.BooleanField(default=True)   # actif ou archivé
    date_candidature = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.code} — {self.nom} {self.prenom}"

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class Inscription(models.Model):
    """Miroir de la table `inscription` du Digital Campus original.
    Lien : etudiant → classe + annee + etab.
    """

    class TypeInscription(models.TextChoices):
        NOUVEAU = 'nouveau', 'Nouveau'
        REINSCRIT = 'reinscrit', 'Réinscrit'
        TRANSFERT = 'transfert', 'Transfert'

    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='inscriptions')
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name='inscriptions')
    annee = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE, related_name='inscriptions')
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='inscriptions')
    type_inscription = models.CharField(max_length=20, choices=TypeInscription.choices, default=TypeInscription.NOUVEAU)
    statut_paiement = models.BooleanField(default=False)   # frais d'inscription payés
    montant_paye = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    date_inscription = models.DateField(auto_now_add=True)
    est_valide = models.BooleanField(default=True)

    class Meta:
        unique_together = ('etudiant', 'annee')
        ordering = ['-date_inscription']

    def __str__(self):
        return f"{self.etudiant.code} — {self.classe} ({self.annee})"
