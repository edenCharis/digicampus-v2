from django.urls import path
from . import views

urlpatterns = [
    path('personnel/stats/',              views.PersonnelStatsView.as_view()),
    path('personnel/departements/',       views.DepartementListView.as_view()),
    path('personnel/departements/<int:pk>/', views.DepartementDetailView.as_view()),
    path('personnel/agents/',             views.AgentListView.as_view()),
    path('personnel/agents/<int:pk>/',    views.AgentDetailView.as_view()),
    path('personnel/conges/',             views.CongeListView.as_view()),
    path('personnel/conges/<int:pk>/',    views.CongeDetailView.as_view()),
]
