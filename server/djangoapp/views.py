# Uncomment the required imports before adding the code
# from django.shortcuts import render
# from django.http import HttpResponseRedirect, HttpResponse
from django.contrib.auth.models import User

# from django.shortcuts import get_object_or_404, render, redirect
from django.contrib.auth import logout

# from django.contrib import messages
# from datetime import datetime
from .models import CarMake, CarModel
from django.http import JsonResponse
from django.contrib.auth import login, authenticate
import logging
import json
from django.views.decorators.csrf import csrf_exempt
from .populate import initiate
from .restapis import get_request, analyze_review_sentiments, post_request

# Get an instance of a logger
logger = logging.getLogger(__name__)


# Create your views here.


def get_cars(request):
    count = CarMake.objects.filter().count()
    print(count)
    if count == 0:
        initiate()
    car_models = CarModel.objects.select_related("car_make")
    cars = []
    for car_model in car_models:
        cars.append(
            {
                "CarModel": car_model.name,
                "CarMake": car_model.car_make.name
            }
        )
    return JsonResponse({"CarModels": cars})


# Create a `login_request` view to handle sign in request
@csrf_exempt
def login_user(request):
    # Get username and password from request.POST dictionary
    data = json.loads(request.body)
    username = data["userName"]
    password = data["password"]
    # Try to check if provide credential can be authenticated
    user = authenticate(username=username, password=password)
    data = {"userName": username}
    if user is not None:
        # If user is valid, call login method to login current user
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
    return JsonResponse(data)


# Create a `logout_request` view to handle sign out request
@csrf_exempt
def logout_request(request):
    try:
        logger.info(f"Logout request received. Method: {request.method}")
        logger.info(f"User authenticated: {request.user.is_authenticated}")

        username = ""
        if request.user.is_authenticated:
            username = request.user.username
            logger.info(f"Logging out user: {username}")
            logout(request)
            logger.info("User logged out successfully")
        else:
            logger.info("No authenticated user to log out")

        data = {"userName": username, "status": "success"}
        logger.info(f"Returning response: {data}")
        return JsonResponse(data)

    except Exception as e:
        logger.error(f"Error in logout_request: {str(e)}")
        return JsonResponse({"error": str(e), "status": "error"}, status=500)


# Create a `registration` view to handle sign up request
@csrf_exempt
def registration(request):
    # context = {}

    # Load JSON data from the request body
    data = json.loads(request.body)
    username = data["userName"]
    password = data["password"]
    first_name = data["firstName"]
    last_name = data["lastName"]
    email = data["email"]
    username_exist = False
    # email_exist = False
    try:
        # Check if user already exists
        User.objects.get(username=username)
        username_exist = True
    except BaseException:
        # If not, simply log this is a new user
        logger.debug("{} is new user".format(username))

    # If it is a new user
    if not username_exist:
        # Create user in auth_user table
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
            email=email,
        )
        # Login the user and redirect to list page
        login(request, user)
        data = {"userName": username, "status": "Authenticated"}
        return JsonResponse(data)
    else:
        data = {"userName": username, "error": "Already Registered"}
        return JsonResponse(data)


# Update the `get_dealerships` render list of dealerships all by default,
# particular state if state is passed
def get_dealerships(request, state="All"):
    try:
        logger.info(f"get_dealerships called with state: {state}")

        if state == "All":
            endpoint = "/fetchDealers"
        else:
            endpoint = "/fetchDealers/" + state

        logger.info(f"Calling endpoint: {endpoint}")

        dealerships = get_request(endpoint)

        logger.info(f"Received dealerships: {dealerships}")

        if dealerships is None:
            logger.error("get_request returned None")
            return JsonResponse(
                {
                    "status": 500,
                    "message": "Failed to fetch dealerships",
                    "dealers": [],
                }
            )

        return JsonResponse({"status": 200, "dealers": dealerships})

    except Exception as e:
        logger.error(f"Error in get_dealerships: {str(e)}")
        return JsonResponse(
            {
                "status": 500,
                "message": f"Internal server error: {str(e)}",
                "dealers": [],
            }
        )


def get_dealer_reviews(request, dealer_id):
    try:
        # if dealer id has been provided
        if dealer_id:
            endpoint = "/fetchReviews/dealer/" + str(dealer_id)
            reviews = get_request(endpoint)
            
            # Handle case where reviews might be None or empty
            if not reviews:
                logger.info(f"No reviews found for dealer {dealer_id}")
                return JsonResponse({"status": 200, "reviews": []})
            
            # Process sentiment analysis for each review
            for review_detail in reviews:
                try:
                    if 'review' in review_detail and review_detail['review']:
                        response = analyze_review_sentiments(review_detail["review"])
                        print(f"Sentiment analysis response: {response}")
                        if response and 'sentiment' in response:
                            review_detail["sentiment"] = response["sentiment"]
                        else:
                            review_detail["sentiment"] = "neutral"  # Default sentiment
                    else:
                        review_detail["sentiment"] = "neutral"
                except Exception as e:
                    logger.error(f"Error analyzing sentiment for review: {str(e)}")
                    review_detail["sentiment"] = "neutral"
            
            logger.info(f"Returning {len(reviews)} reviews for dealer {dealer_id}")
            return JsonResponse({"status": 200, "reviews": reviews})
        else:
            return JsonResponse({"status": 400, "message": "Bad Request"})
    
    except Exception as e:
        logger.error(f"Error in get_dealer_reviews: {str(e)}")
        return JsonResponse({"status": 500, "message": f"Internal server error: {str(e)}", "reviews": []})


def get_dealer_details(request, dealer_id):
    try:
        if dealer_id:
            endpoint = "/fetchDealer/" + str(dealer_id)
            dealership = get_request(endpoint)
            
            if not dealership:
                return JsonResponse({"status": 404, "message": "Dealer not found"})
            
            return JsonResponse({"status": 200, "dealer": dealership})
        else:
            return JsonResponse({"status": 400, "message": "Bad Request"})
    
    except Exception as e:
        logger.error(f"Error in get_dealer_details: {str(e)}")
        return JsonResponse({"status": 500, "message": f"Internal server error: {str(e)}"})


@csrf_exempt
def add_review(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"status": 403, "message": "Unauthorized"})
        
        if request.method != 'POST':
            return JsonResponse({"status": 405, "message": "Method not allowed"})
        
        # Parse the JSON data from request body
        data = json.loads(request.body)
        logger.info(f"Received review data: {data}")
        
        # Validate required fields
        required_fields = ['name', 'dealership', 'review', 'car_make', 'car_model', 'car_year']
        for field in required_fields:
            if field not in data or not data[field]:
                return JsonResponse({"status": 400, "message": f"Missing required field: {field}"})
        
        # Prepare the review data for the API call
        review_data = {
            "name": data["name"],
            "dealership": int(data["dealership"]),
            "review": data["review"],
            "purchase": data.get("purchase", True),
            "purchase_date": data.get("purchase_date", ""),
            "car_make": data["car_make"],
            "car_model": data["car_model"],
            "car_year": int(data["car_year"])
        }
        
        # Call the API to post the review
        response = post_request("/insert/review", review_data)
        logger.info(f"API response: {response}")
        
        if response:
            return JsonResponse({"status": 200, "message": "Review posted successfully"})
        else:
            return JsonResponse({"status": 500, "message": "Failed to post review"})
            
    except json.JSONDecodeError:
        return JsonResponse({"status": 400, "message": "Invalid JSON data"})
    except ValueError as e:
        return JsonResponse({"status": 400, "message": f"Invalid data format: {str(e)}"})
    except Exception as e:
        logger.error(f"Error in add_review: {str(e)}")
        return JsonResponse({
            "status": 500,
            "message": "Error in posting review"
        })