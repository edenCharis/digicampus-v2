from rest_framework.permissions import BasePermission

ADMIN = 'administrateur'
SCOLARITE = 'scolarité'
DOYEN = 'doyen'
ENSEIGNANT = 'enseignant'
PROFESSEUR = 'professeur'
COURS = 'cours'
INSCRIPTION = 'inscription'
ANONYMAT = 'anonymat'
DAARHSPE = 'daarhspe'
GESNOTE = 'gesnote'
SOUTENANCE = 'soutenance'
SUIVI = 'suivi'
CAISSE = 'caisse'
PVD = 'pvd'


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == ADMIN


class IsAdminOrScolarite(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (ADMIN, SCOLARITE)


class IsAdminOrDoyen(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (ADMIN, DOYEN)


class AcademicReadPermission(BasePermission):
    """Read: all authenticated. Write: admin or scolarité."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return request.user.role in (ADMIN, SCOLARITE)


class EtudiantPermission(BasePermission):
    ALLOWED_ROLES = (ADMIN, SCOLARITE, INSCRIPTION, DOYEN, GESNOTE, ANONYMAT)

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in self.ALLOWED_ROLES
