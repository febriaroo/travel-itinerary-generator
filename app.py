from flask import Flask, request, Response, render_template, stream_with_context
import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# Load sensitive credentials from environment variables
API_KEY = os.getenv("MODEL_STUDIO_API_KEY")
APP_ID = os.getenv("MODEL_STUDIO_APP_ID")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


@app.route('/')
def index():
    return render_template('index.html', google_maps_api_key=GOOGLE_MAPS_API_KEY)


def fetch_itinerary_for_date(destination, date_str, interests, visited_places):
    url = f"https://dashscope-intl.aliyuncs.com/api/v1/apps/{APP_ID}/completion"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = f"""
    Create a unique travel itinerary for {destination} on {date_str}.
    Include:
    - Morning, afternoon, and evening activities with specific and detailed descriptions.
    - Latitude and longitude for each activity location.
    - Recommendations for food and accommodations (also include latitude and longitude for these locations).
    Ensure:
    - No activities or places are repeated from previous days: {visited_places}.
    - The response is in valid JSON format with the following structure:
    {{
        "day": "{date_str}",
        "morning": {{
            "activity": "Activity name",
            "description": "Detailed activity description",
            "lat": 0.0,
            "lng": 0.0
        }},
        "afternoon": {{
            "activity": "Activity name",
            "description": "Detailed activity description",
            "lat": 0.0,
            "lng": 0.0
        }},
        "evening": {{
            "activity": "Activity name",
            "description": "Detailed activity description",
            "lat": 0.0,
            "lng": 0.0
        }},
        "recommendations": {{
            "food": [
                {{"name": "Food place", "lat": 0.0, "lng": 0.0}}
            ],
            "accommodations": [
                {{"name": "Accommodation name", "lat": 0.0, "lng": 0.0}}
            ]
        }}
    }}
    """
    payload = {
        "input": {"prompt": prompt},
        "parameters": {},
        "debug": {}
    }

    response = requests.post(url, json=payload, headers=headers)
    print(f"[DEBUG] Response for {date_str}: {response.status_code} - {response.text}")
    if response.status_code == 200:
        raw_text = response.json().get("output", {}).get("text", "{}")
        if raw_text.startswith("```json"):
            raw_text = raw_text.strip("```json").strip().strip("```")
        try:
            itinerary = json.loads(raw_text)
            return itinerary
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSONDecodeError for {date_str}: {e}")
            return {"error": f"Invalid JSON structure in response for {date_str}: {str(e)}"}
    else:
        print(f"[ERROR] API Request failed for {date_str}: {response.text}")
        return {"error": f"API request failed for {date_str}: {response.status_code} - {response.text}"}


@app.route('/itinerary_stream', methods=['GET'])
def itinerary_stream():
    destination = request.args.get('destination')
    start_date = request.args.get('start_date')
    trip_days = int(request.args.get('trip_days'))
    interests = request.args.get('interests')

    if not destination or not start_date or not trip_days:
        return Response("Missing required query parameters.", status=400)

    start_date = datetime.strptime(start_date, "%Y-%m-%d")
    visited_places = set()

    @stream_with_context
    def generate(destination, start_date, trip_days, interests):
        for day in range(trip_days):
            date_str = (start_date + timedelta(days=day)).strftime("%Y-%m-%d")
            print(f"[DEBUG] Generating itinerary for: {date_str}")
            try:
                result = fetch_itinerary_for_date(destination, date_str, interests, list(visited_places))
                if "error" in result:
                    yield f"data: {json.dumps({'id': date_str, 'error': result['error']})}\n\n"
                else:
                    visited_places.update([
                        result["morning"]["activity"],
                        result["afternoon"]["activity"],
                        result["evening"]["activity"],
                        *(rec["name"] for rec in result["recommendations"]["food"]),
                        *(rec["name"] for rec in result["recommendations"]["accommodations"])
                    ])
                    yield f"data: {json.dumps({'id': date_str, 'day': result})}\n\n"
            except Exception as e:
                error_message = f"Exception occurred for {date_str}: {str(e)}"
                print(f"[ERROR] {error_message}")
                yield f"data: {json.dumps({'id': date_str, 'error': error_message})}\n\n"
        yield "event: close\ndata: {}\n\n"

    return Response(generate(destination, start_date, trip_days, interests), content_type='text/event-stream')


if __name__ == '__main__':
    app.run(debug=True)
