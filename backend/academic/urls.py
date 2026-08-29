from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('annees/', views.AnneeListView.as_view(), name='annees'),
    path('specialites/', views.SpecialiteListView.as_view(), name='specialites'),
    path('classes/', views.ClasseListView.as_view(), name='classes'),
    path('ues/', views.UEListView.as_view(), name='ues'),
    path('ues/<int:pk>/', views.UEDetailView.as_view(), name='ue-detail'),
    path('etudiants/', views.EtudiantListView.as_view(), name='etudiants'),
    path('etudiants/<int:pk>/', views.EtudiantDetailView.as_view(), name='etudiant-detail'),
    path('inscriptions/', views.InscriptionListView.as_view(), name='inscriptions'),
]
