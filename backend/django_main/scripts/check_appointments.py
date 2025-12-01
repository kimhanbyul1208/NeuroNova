import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from apps.custom.models import Appointment
from apps.users.models import User

def check_data():
    print(f"Total Appointments: {Appointment.objects.count()}")
    
    appointments = Appointment.objects.all()
    for apt in appointments:
        print(f"ID: {apt.id}, Patient: {apt.patient}, Doctor: {apt.doctor}, Time: {apt.scheduled_at}")

    print("-" * 30)
    print(f"Total Users: {User.objects.count()}")

if __name__ == '__main__':
    check_data()
