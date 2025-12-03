from django.urls import path
from . import views

app_name = 'ml_proxy'

urlpatterns = [
    # Flask ML 서버 프록시 엔드포인트
    path('v1/predict/', views.predict_proxy, name='predict'),
    path('v1/status/', views.status_proxy, name='status'),
    path('v1/model-info/', views.model_info_proxy, name='model_info'),
    path('v1/retrain/', views.retrain_proxy, name='retrain'),
    path('v1/example-data/', views.example_data_proxy, name='example_data'),

    # 추론 이력 조회 엔드포인트
    path('v1/history/', views.history_view, name='history'),
]
