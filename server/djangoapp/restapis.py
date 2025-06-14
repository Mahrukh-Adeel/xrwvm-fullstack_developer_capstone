import requests
import os
from dotenv import load_dotenv

load_dotenv()

backend_url = os.getenv('backend_url', default="http://localhost:3030")
sentiment_analyzer_url = os.getenv('sentiment_analyzer_url', default="http://localhost:5050/")

def get_request(endpoint, **kwargs):
    params = ""
    if kwargs:
        for key, value in kwargs.items():
            params = params + key + "=" + value + "&"
    
    # Remove trailing & if params exist
    if params:
        request_url = backend_url + endpoint + "?" + params.rstrip('&')
    else:
        request_url = backend_url + endpoint
        
    print("GET from {} ".format(request_url))
    
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url, timeout=10)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.ConnectionError:
        print(f"Connection error: Could not connect to {request_url}")
        print("Make sure the backend service is running on {backend_url}")
        return None
    except requests.exceptions.Timeout:
        print(f"Timeout error: Request to {request_url} timed out")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

def analyze_review_sentiments(text):
    request_url = sentiment_analyzer_url + "analyze/" + text
    try:
        # Call get method of requests library with URL and parameters
        response = requests.get(request_url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as err:
        print(f"Unexpected {err=}, {type(err)=}")
        print("Network exception occurred")
        return {"sentiment": "neutral"}  # Default sentiment

def post_review(data_dict):
    request_url = backend_url + "/insert_review"
    try:
        response = requests.post(request_url, json=data_dict, timeout=10)
        response.raise_for_status()
        print(response.json())
        return response.json()
    except Exception as e:
        print(f"Network exception occurred: {e}")
        return None