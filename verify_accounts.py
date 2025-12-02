import requests

def test_login(username, password):
    url = "http://localhost:8000/api/v1/users/login/"
    data = {"username": username, "password": password}
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            print(f"[SUCCESS] {username} / {password}")
            return True
        else:
            print(f"[FAILED] {username} / {password} - {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] {username} / {password} - {e}")
        return False

print("Verifying Doctor Accounts...")
test_login("doctor1", "doctor123")
test_login("doctor1", "password123")

print("\nVerifying Patient Accounts...")
test_login("patient1", "patient123")
test_login("patient1", "password123")
