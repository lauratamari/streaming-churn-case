from dotenv import load_dotenv
import os
import psycopg2

#As I am usign a .env file, will use dotenv to load the database credentials
load_dotenv()

def get_connection():
    try:
        connection = psycopg2.connect(
            host = os.getenv("DB_HOST"),
            database = os.getenv("DB_NAME"),
            user = os.getenv("DB_USER"),
            password = os.getenv("DB_PASSWORD"),
            port = os.getenv("DB_PORT")
        )

        return connection
    
    except Exception as e:
        print("Database connection error: ", e)
        raise
    
