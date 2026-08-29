from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('annees/', views.AnneeListView.as_view(), name='annees'),
    path('specialites/', views.SpecialiteListView.as_view(), name='specialites'),
    path('classes/', views.ClasseListView.as_view(), name='classes'),
    path('ues/', views.UEListView.as_view(), name='ues'),
    path('ues/<int:pk>/', views.UEDetailView.as_view(), name='ue-detail'),
    path('ecues/', views.ECUEListView.as_view(), name='ecues'),
    path('ecues/<int:pk>/', views.ECUEDetailView.as_view(), name='ecue-detail'),
    path('classes/<int:pk>/', views.ClasseDetailView.as_view(), name='classe-detail'),
    path('etudiants/', views.EtudiantListView.as_view(), name='etudiants'),
    path('etudiants/<int:pk>/', views.EtudiantDetailView.as_view(), name='etudiant-detail'),
    path('inscriptions/', views.InscriptionListView.as_view(), name='inscriptions'),
    path('inscriptions/create/', views.InscriptionCreateView.as_view(), name='inscription-create'),
    path('inscriptions/reinscription/', views.ReinscriptionView.as_view(), name='reinscription'),
]
