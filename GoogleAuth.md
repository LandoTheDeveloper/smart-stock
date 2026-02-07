# How to Set Up Google Auth

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

## .ENV for client folder
For development purposes we run the api locally (http://localhost:<api-port-here>) but in production it just goes to (https://smart-stock.food) do the following:
1. Add a new `.env.production` and `.env.development` files under the client folder
2. Inside `.env.development` add the following: VITE_API_URL="http://localhost:<api-port-here>"
3. Inside `.env.production` add the following: VITE_API_URL="https://smart-stock.food"

## .ENV for smart-stock-mobile folder
For development purposes, if you are using expo go you need to tunnel the api, but in production it just goes to the main url. Do the following:
1. Add `.env.production` and `.env.development` files inside of smart-stock-mobile
2. Inside `.env.development` add the following: EXPO_PUBLIC_API_URL="url here"
    1. Google does not like raw ip addresses, you can tunnel the server using a service like ngrok and add the url here
3. Inside `.env.production` add the following EXPO_PUBLIC_API_URL="https://smart-stock.food"