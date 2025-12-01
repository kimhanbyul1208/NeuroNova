import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def create_groups():
    # Define Groups
    groups = {
        'ADMIN': [], # Admin gets all permissions usually, or we can be specific
        'DOCTOR': [
            # Custom App
            'view_doctor', 'change_doctor',
            'view_patientdoctor', 'add_patientdoctor', 'change_patientdoctor',
            'view_appointment', 'add_appointment', 'change_appointment', 'delete_appointment',
            'view_prescription', 'add_prescription', 'change_prescription', 'delete_prescription',
            'view_patientpredictionresult', 'change_patientpredictionresult',
            # EMR App
            'view_patient', 'add_patient', 'change_patient',
            'view_encounter', 'add_encounter', 'change_encounter',
            'view_formsoap', 'add_formsoap', 'change_formsoap',
            'view_formvitals', 'add_formvitals', 'change_formvitals',
            'view_mergeddocument', 'add_mergeddocument',
        ],
        'NURSE': [
            # Custom App
            'view_doctor',
            'view_appointment', 'add_appointment', 'change_appointment',
            'view_prescription',
            # EMR App
            'view_patient', 'add_patient', 'change_patient',
            'view_encounter', 'add_encounter', 'change_encounter',
            'view_formvitals', 'add_formvitals', 'change_formvitals',
        ],
        'PATIENT': [
            # Limited permissions, mostly read their own data (handled by logic, but basic model access here)
            'view_appointment',
            'view_prescription',
            'view_doctor',
        ]
    }

    for group_name, perms in groups.items():
        group, created = Group.objects.get_or_create(name=group_name)
        if created:
            print(f"Created group: {group_name}")
        else:
            print(f"Group exists: {group_name}")

        # Assign Permissions
        if group_name == 'ADMIN':
            # Give all permissions to Admin for simplicity in this context
            # Or specific ones if preferred. Let's give all for now to ensure full access.
            all_perms = Permission.objects.all()
            group.permissions.set(all_perms)
            print(f"  - Assigned ALL {all_perms.count()} permissions to ADMIN")
        else:
            # Filter permissions by codename
            # Note: This might be ambiguous if multiple apps have same codename, 
            # but usually they are unique enough or we filter by app if needed.
            # For now, matching by codename is a good start.
            
            valid_perms = []
            for codename in perms:
                try:
                    p = Permission.objects.get(codename=codename)
                    valid_perms.append(p)
                except Permission.DoesNotExist:
                    print(f"  [WARNING] Permission not found: {codename}")
                except Permission.MultipleObjectsReturned:
                    # If multiple, we might need to be more specific. 
                    # Let's grab all matching (e.g. view_patient in emr vs other app)
                    ps = Permission.objects.filter(codename=codename)
                    for p in ps:
                        valid_perms.append(p)
            
            group.permissions.set(valid_perms)
            print(f"  - Assigned {len(valid_perms)} permissions to {group_name}")

if __name__ == '__main__':
    create_groups()
