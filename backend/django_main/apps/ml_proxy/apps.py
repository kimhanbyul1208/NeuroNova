from django.apps import AppConfig


class MlProxyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ml_proxy"
    verbose_name = "ML Proxy & Inference Logging"
