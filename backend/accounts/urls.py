from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('auth/login/',   views.CustomLoginView.as_view(), name='login'),
    path('auth/logout/',  views.LogoutView.as_view(),      name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(),      name='token_refresh'),
    path('auth/me/',      views.MeView.as_view(),          name='me'),

    path('universities/',           views.UniversityListView.as_view(),       name='universities'),
    path('universities/<int:pk>/',  views.UniversityDetailView.as_view(),     name='university-detail'),

    path('etablissements/',           views.EtablissementListView.as_view(),   name='etablissements'),
    path('etablissements/<int:pk>/',  views.EtablissementDetailView.as_view(), name='etablissement-detail'),

    path('users/',           views.UserListView.as_view(),   name='users'),
    path('users/<int:pk>/',  views.UserDetailView.as_view(), name='user-detail'),

    path('abonnements/',             views.AbonnementListView.as_view(),   name='abonnements'),
    path('abonnements/<int:pk>/',    views.AbonnementDetailView.as_view(), name='abonnement-detail'),
    path('abonnements/ensure/',      views.AbonnementEnsureView.as_view(), name='abonnement-ensure'),

    path('logs/',            views.ActivityLogListView.as_view(), name='logs'),
    path('admin-stats/',     views.AdminStatsView.as_view(),      name='admin-stats'),
]
