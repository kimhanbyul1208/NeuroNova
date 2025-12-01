import requests
import json

headers = {"Content-Type": "application/json"}
data = {
    "username": "patient_final_v3",
    "email": "final3@example.com",
    "password": "StrongPassword123!",
    "password_confirm": "StrongPassword123!",
    "first_name": "Final",
    "last_name": "Patient",
    "role": "PATIENT",
    "phone_number": "010-1234-5678"
}

endpoints = [
    "http://localhost:8000/api/v1/users/register/"
]

for url in endpoints:
    print(f"Testing URL: {url}")
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 20)
