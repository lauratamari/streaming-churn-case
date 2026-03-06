import random
import logging
from datetime import datetime, timedelta
from backend.database import get_connection
from psycopg2.extras import execute_values

#using logging instead of print()
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

#Constants
COUNTRIES = ["USA", "Brazil", "UK", "Japan", "South Africa", "Canada", "Mexico", "Portugal", "Spain", "Germany", "Thailand", "Argentina", "South Korea"]

PLANS = ["Basic", "Standard", "Premium"]

BILLING_CYCLE = ["monthly", "yearly"]

PRICE_MAP = {"Basic": 9.99, "Standard": 14.99, "Premium": 19.99}

CHURN_WEIGHTS = {"days_since_last_watch": 0.5, "tickets": 0.3, "price_and_low_watch": 0.2}

#creating the tables, the DB was previously created on PostgreSQL
def create_tables(cursor: object) -> None:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users(
            user_id SERIAL PRIMARY KEY,
            age INT,
            country VARCHAR(50),
            signup_date DATE
        );

        CREATE TABLE IF NOT EXISTS subscriptions(
            subscription_id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES users(user_id),
            plan VARCHAR(20),
            billing_cycle VARCHAR(10),
            monthly_price NUMERIC(6,2),
            yearly_price NUMERIC(8,2),
            cancelled BOOLEAN DEFAULT FALSE,
            cancellation_date DATE,
            last_renewal_date DATE,
            next_renewal_date DATE,
            start_date DATE
        );

        CREATE TABLE IF NOT EXISTS engagement(
            engagement_id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES users(user_id),
            avg_watch_hours_per_week NUMERIC(6,2),
            number_of_logins_per_week INT,
            days_since_last_watch INT,
            completion_rate NUMERIC(4,2)
        );

        CREATE TABLE IF NOT EXISTS support_tickets(
            support_id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES users(user_id),
            tickets_last_30d INT
        );

        CREATE TABLE IF NOT EXISTS billing(
            billing_id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES users(user_id),
            price_increase_last_6m BOOLEAN,
            payment_failures INT
        );

        CREATE TABLE IF NOT EXISTS churn_labels(
            churn_id SERIAL PRIMARY KEY,
            user_id INT UNIQUE REFERENCES users(user_id),
            -- 0 = customer renewing their subscription at renewal date
            -- 1 = customer cancelling their subscription before renewal date
            -- 2 = customer not renewing their subscription at renewal date
            churn_type INT CHECK (churn_type IN (0, 1, 2))
        );
    """)

#this will generate 5k users
def seed_users(cursor: object, n: int = 5000) -> None:
    now = datetime.now()
    users_data = []

    for _ in range(n):
        age = random.randint(18, 65)
        country = random.choice(COUNTRIES)
        #generates a random integer between 0 and 1500, it will then subtract that number from today's date to generate a signup date
        signup_date = now - timedelta(days=random.randint(0, 1500))
        users_data.append((age, country, signup_date))

    #execute_values permits to perform a bulk update, instead of a loop inserting one row at a time. this makes it faster
    execute_values(cursor, """
        INSERT INTO users (age, country, signup_date)
        VALUES %s
        RETURNING user_id;
    """, users_data, page_size=n)

    #need to get all the user_ids because all other tables use user_id as a FK
    user_ids = [row[0] for row in cursor.fetchall()]
    logger.debug(f"Users inserted: {len(user_ids)}")

    subscriptions_data = []
    engagement_data = []
    support_data = []
    billing_data = []
    churn_data = []

    for i, user_id in enumerate(user_ids):
        signup_date = users_data[i][2]

        #subscription
        plan = random.choice(PLANS)
        billing_cycle = random.choice(BILLING_CYCLE)
        monthly_price = PRICE_MAP[plan]
        # yearly price = monthly * 12 with 10% discount
        yearly_price = round(monthly_price * 12 * 0.90, 2) if billing_cycle == "yearly" else None
        #renewal interval depends on billing cycle
        renewal_days = 365 if billing_cycle == "yearly" else 30
        renewal_interval = timedelta(days=renewal_days)
        # last_renewal_date: most recent completed renewal since signup
        days_active = (now - signup_date).days
        cycles_elapsed = days_active // renewal_days
        last_renewal_date = (signup_date + timedelta(days=cycles_elapsed * renewal_days)).date()
        next_renewal_date = last_renewal_date + renewal_interval
        #around 15% of users have cancelled
        cancelled = random.random() < 0.15
        #default - not cancelled
        cancellation_date = None
        if cancelled:
            #calculates how many days it has passes since last renewal date
            days_into_cycle = (now.date() - last_renewal_date).days
            #picks a random number to represent the day subscription was cancelled
            cancel_offset = random.randint(1, max(1, days_into_cycle))
            #calculates the real date it was cancelled
            cancellation_date = last_renewal_date + timedelta(days=cancel_offset)
            #making sure the date is not in the future
            if cancellation_date > now.date():
                cancellation_date = now.date()

        subscriptions_data.append((
            user_id, plan, billing_cycle, monthly_price, yearly_price,
            cancelled, cancellation_date, last_renewal_date, next_renewal_date, signup_date
        ))

        #engagement
        watch_hours = round(random.uniform(0, 20), 2)
        days_since_last_watch = random.randint(0, 60)
        logins = random.randint(0, 20)
        completion = round(random.uniform(0.2, 1.0), 2)
        engagement_data.append((user_id, watch_hours, logins, days_since_last_watch, completion))

        #Support tickets
        tickets = random.randint(0, 5)
        support_data.append((user_id, tickets))

        #Billing
        price_increase = random.random() < 0.2
        payment_failures = random.randint(0, 2)
        billing_data.append((user_id, price_increase, payment_failures))

        #Weighted churn probability with noise
        churn_score = (
            (days_since_last_watch > 40) * CHURN_WEIGHTS["days_since_last_watch"] +
            (tickets > 3) * CHURN_WEIGHTS["tickets"] +
            (price_increase and watch_hours < 5) * CHURN_WEIGHTS["price_and_low_watch"]
        )
        churn_prob = churn_score + random.uniform(-0.05, 0.05)
        churn = churn_prob > 0.5

        #class churn_type:
        #0 = renews at renewal date
        #1 = cancels before renewal date
        #2 = does not renew at renewal date
        if not churn:
            churn_type = 0
        elif cancelled:
            churn_type = 1
        else:
            churn_type = 2

        churn_data.append((user_id, churn_type))

    execute_values(cursor, """
        INSERT INTO subscriptions (
            user_id, plan, billing_cycle, monthly_price, yearly_price,
            cancelled, cancellation_date, last_renewal_date, next_renewal_date, start_date
        )
        VALUES %s
    """, subscriptions_data)

    execute_values(cursor, """
        INSERT INTO engagement (user_id, avg_watch_hours_per_week, number_of_logins_per_week, days_since_last_watch, completion_rate)
        VALUES %s
    """, engagement_data)

    execute_values(cursor, """
        INSERT INTO support_tickets (user_id, tickets_last_30d)
        VALUES %s
    """, support_data)

    execute_values(cursor, """
        INSERT INTO billing (user_id, price_increase_last_6m, payment_failures)
        VALUES %s
    """, billing_data)

    execute_values(cursor, """
        INSERT INTO churn_labels (user_id, churn_type)
        VALUES %s
    """, churn_data)


def main() -> None:
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SET search_path TO public")

    try:
        logger.info("Creating tables...")
        create_tables(cursor)

        logger.info("Seeding data...")
        seed_users(cursor, n=5000)

        connection.commit()
        logger.info("Database seeded successfully!")

    except Exception as e:
        connection.rollback()
        logger.error("Error: %s", e)
        raise

    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    main()