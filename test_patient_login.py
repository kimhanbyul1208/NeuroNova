import requests
import json

headers = {"Content-Type": "application/json"}
data = {
    "username": "patient1",
    "password": "password123"
}

url = "http://localhost:8000/api/v1/users/login/"

print(f"Testing URL: {url}")
try:
    response = requests.post(url, json=data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
