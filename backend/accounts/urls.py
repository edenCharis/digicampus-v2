from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/login/', views.CustomLoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.MeView.as_view(), name='me'),
    path('universities/', views.UniversityListView.as_view(), name='universities'),
    path('etablissements/', views.EtablissementListView.as_view(), name='etablissements'),
    path('users/', views.UserListView.as_view(), name='users'),
]
