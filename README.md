# Travel Itinerary Generator

Hey there! 👋  
Welcome to my **Travel Itinerary Generator** project. This is something I built for fun to explore **Alibaba Cloud’s Model Studio** and their **Qwen LLM model**. It combines AI and travel planning—two things I really enjoy.

## What It Does 🧳

- **Day-by-Day Itineraries**: Create detailed travel plans based on your destination, travel dates, and interests.
- **Interactive Maps**: See all your activities, food recommendations, and accommodations on a dynamic map.
- **Recommendations**: Get top-rated food spots and places to stay for each day of your trip.

## Why I Made This 💡

I wanted to try out Alibaba Cloud’s tools like Model Studio and the Qwen LLM model, and this seemed like the perfect way to do it. Plus, who doesn’t love pretending to plan vacations while testing out some cool AI tech?

## What I Used 🛠️

Here’s the tech stack:

- **Frontend**: HTML, custom CSS, and JavaScript.
- **Backend**: Flask (Python).
- **APIs**:
  - **Model Studio API**: The brain behind the trip itineraries.
  - **Google Maps API**: Brings your trip locations to life with maps and markers.

## Try It Out 🚀

### Prerequisites

- **Python 3.7+** ([Get it here](https://www.python.org/))
- **Git** ([Install it here](https://git-scm.com/))
- API keys for:
  - **Model Studio API**
  - **Google Maps API**

### Steps to Run Locally

1. **Clone the Repo**:

   ```
   git clone git@github.com:febriaroo/travel-itinerary-generator.git
   cd travel-itinerary-generator
   ```

2. **Set Up a Virtual Environment**:

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install Dependencies:
   ```bash
   pip install -r requirements.txt 
   ```
4. Set Up API Keys - Create a .env file in the root folder with the following structure:
   ```bash
	MODEL_STUDIO_API_KEY=your_model_studio_api_key
	MODEL_STUDIO_APP_ID=your_model_studio_app_id
	GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```
5. Run the App:
   ```bash
   python app.py

   ```

6. Access the App: `Open http://127.0.0.1:5000 in your browser.`

### How It Works 🎯
1. Fill out the form with your trip details: destination, start date, number of days, and interests.
2. Click “Generate Itinerary” and let the app do its thing.
3. Check out the detailed daily itinerary, complete with maps, recommendations, and activities.
4. Explore the interactive maps to see how everything fits together.

### File Structure 📂
```
travel-itinerary-generator/
├── static/
│ ├── css/
│ │ └── styles.css # Custom CSS for styling
│ ├── js/
│ │ └── scripts.js # JavaScript for functionality
│ └── images/ # Placeholder for images
├── templates/
│ └── index.html # Frontend template
├── app.py # Flask backend logic
├── requirements.txt # Python dependencies
├── .env # Environment variables (ignored in repo)
└── README.md # This documentation

```
