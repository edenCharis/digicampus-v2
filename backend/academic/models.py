from django.db import models
from accounts.models import Etablissement


class AnneeAcademique(models.Model):
    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='annees')
    libelle = models.CharField(max_length=20)  # e.g. "2024-2025"
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
    niveau = models.CharField(max_length=20)  # L1, L2, L3, M1, M2…
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


class Etudiant(models.Model):
    class Sexe(models.TextChoices):
        M = 'M', 'Masculin'
        F = 'F', 'Féminin'

    etablissement = models.ForeignKey(Etablissement, on_delete=models.CASCADE, related_name='etudiants')
    matricule = models.CharField(max_length=50)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    sexe = models.CharField(max_length=1, choices=Sexe.choices, default=Sexe.M)
    date_naissance = models.DateField(null=True, blank=True)
    lieu_naissance = models.CharField(max_length=100, blank=True)
    nationalite = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    tel = models.CharField(max_length=30, blank=True)
    photo = models.ImageField(upload_to='etudiants/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('etablissement', 'matricule')
        ordering = ['nom', 'prenom']

    def __str__(self):
        return f"{self.matricule} — {self.nom} {self.prenom}"

    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class Inscription(models.Model):
    class Statut(models.TextChoices):
        NOUVEAU = 'nouveau', 'Nouveau'
        REINSCRIT = 'reinscrit', 'Réinscrit'
        TRANSFERT = 'transfert', 'Transfert'

    etudiant = models.ForeignKey(Etudiant, on_delete=models.CASCADE, related_name='inscriptions')
    classe = models.ForeignKey(Classe, on_delete=models.CASCADE, related_name='inscriptions')
    annee = models.ForeignKey(AnneeAcademique, on_delete=models.CASCADE, related_name='inscriptions')
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.NOUVEAU)
    date_inscription = models.DateField(auto_now_add=True)
    montant_paye = models.DecimalField(max_digits=12, decimal_places=0, default=0)
    est_valide = models.BooleanField(default=False)

    class Meta:
        unique_together = ('etudiant', 'annee')
        ordering = ['-date_inscription']

    def __str__(self):
        return f"{self.etudiant} — {self.classe} ({self.annee})"
