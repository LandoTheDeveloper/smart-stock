# How to Set Up Google Auth locally

## Set up Google Project

1. Go to google cloud console. 
2. Go to APIs & Services/OAuth consent screen (Hamburger menu)
    1. Fill out the necessary information
4. Go to APIs & Services/Credentials/OAuth 2.0 Client IDs
    1. Create credentials and fill out the necessary information
    2. Under Authorized redirect URIs put all possible URIs just in case. I have:
    ![Authorized URIs](image.png)
    3. Copy the Client ID and Client Secret and add it to the .env file for the server (.env.sample contains the names for those)
    4. Save the information and test. 

## To Run Authentication locally and in production
For development purposes we run the api locally (http://localhost:XYZA) but in production it just goes to the (https://smart-stock.food) do the following:
1. Add a new `.env.production` and `.env.development` files under the client folder
2. Inside `.env.development` add the following: VITE_API_URL="http://localhost:<api-port-here>"
3. Inside `.env.production` add the following: VITE_API_URL="https://smart-stock.food"

## TODOS
1. Update the URLs for the mobile app to use the main website instead of the ngrok URL I used for development.
2. Update the mobile app URL to use the actual URL we will give it instead of using expo's URL.
3. Find a way to keep expo's URL and the mobile app's URL depending on whether we are running the app locally or in production.