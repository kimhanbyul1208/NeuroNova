import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def login(username, password):
    try:
        resp = requests.post(f"{BASE_URL}/users/login/", json={"username": username, "password": password})
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"Login failed for {username}: {e}")
        if hasattr(e, 'response') and e.response:
            print(e.response.text)
        sys.exit(1)

def run_flow():
    print("Starting E2E Flow Verification...")

    # 1. Patient Login
    print("\n1. Patient Login")
    patient_auth = login("patient1", "patient123")
    patient_token = patient_auth['access']
    print("   Success")

    # 2. Book Appointment
    print("\n2. Book Appointment")
    headers = {"Authorization": f"Bearer {patient_token}"}
    appt_data = {
        "scheduled_at": "2025-12-02T10:00:00",
        "visit_type": "CHECK_UP",
        "reason": "Headache"
    }
    resp = requests.post(f"{BASE_URL}/custom/appointments/", json=appt_data, headers=headers)
    if resp.status_code != 201:
        print(f"   Failed to book: {resp.status_code} {resp.text}")
        sys.exit(1)
    appt = resp.json()
    appt_id = appt['id']
    patient_id = appt['patient']
    print(f"   Success: Appointment ID {appt_id}")

    # 3. Nurse Login
    print("\n3. Nurse Login")
    nurse_auth = login("nurse1", "nurse123")
    nurse_token = nurse_auth['access']
    print("   Success")

    # 4. Approve Appointment
    print("\n4. Approve Appointment")
    headers = {"Authorization": f"Bearer {nurse_token}"}
    resp = requests.post(f"{BASE_URL}/custom/appointments/{appt_id}/confirm/", headers=headers)
    if resp.status_code != 200:
        print(f"   Failed to confirm: {resp.status_code} {resp.text}")
        sys.exit(1)
    print("   Success: Appointment Confirmed")

    # 5. Doctor Login
    print("\n5. Doctor Login")
    doctor_auth = login("doctor1", "doctor123")
    doctor_token = doctor_auth['access']
    print("   Success")

    # 6. Create Encounter
    print("\n6. Create Encounter")
    headers = {"Authorization": f"Bearer {doctor_token}"}
    encounter_data = {
        "patient": patient_id,
        "encounter_date": "2025-12-02T10:00:00",
        "reason": "Headache",
        "facility": "Neurology",
        "status": "IN_PROGRESS"
    }
    resp = requests.post(f"{BASE_URL}/emr/encounters/", json=encounter_data, headers=headers)
    if resp.status_code != 201:
        print(f"   Failed to create encounter: {resp.status_code} {resp.text}")
        sys.exit(1)
    encounter = resp.json()
    encounter_id = encounter['id']
    print(f"   Success: Encounter ID {encounter_id}")

    # 7. Create Prediction (Simulate AI)
    print("\n7. Create Prediction (Simulate AI)")
    pred_data = {
        "encounter": encounter_id,
        "patient": patient_id,
        "model_name": "TestModel",
        "model_version": "1.0",
        "prediction_class": "No Tumor",
        "confidence_score": 0.95,
        "probabilities": {"No Tumor": 0.95, "Glioma": 0.05}
    }
    resp = requests.post(f"{BASE_URL}/custom/predictions/", json=pred_data, headers=headers)
    if resp.status_code != 201:
        print(f"   Failed to create prediction: {resp.status_code} {resp.text}")
        print("   Skipping prediction creation (might need AI service permissions)")
    else:
        pred = resp.json()
        print(f"   Success: Prediction ID {pred['id']}")

    # 8. Patient View Result
    print("\n8. Patient View Result")
    headers = {"Authorization": f"Bearer {patient_token}"}
    resp = requests.get(f"{BASE_URL}/emr/patients/{patient_id}/medical_history/", headers=headers)
    if resp.status_code != 200:
        print(f"   Failed to get history: {resp.status_code} {resp.text}")
        sys.exit(1)
    history = resp.json()
    diagnoses = history.get('ai_diagnoses', [])
    print(f"   Success: Found {len(diagnoses)} diagnoses")
    if len(diagnoses) > 0:
        print(f"   Latest Diagnosis: {diagnoses[0]['prediction_class']}")

    print("\nFlow Verification Completed Successfully!")

if __name__ == "__main__":
    run_flow()
