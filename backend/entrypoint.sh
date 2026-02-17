#!/bin/bash
set -e

echo "Waiting for database..."
python -c "
import time, os, psycopg2
url = os.environ.get('DATABASE_URL', '')
parts = url.replace('postgres://', '').split('@')
user_pass = parts[0].split(':')
host_db = parts[1].split('/')
host_port = host_db[0].split(':')
for i in range(30):
    try:
        psycopg2.connect(
            dbname=host_db[1], user=user_pass[0], password=user_pass[1],
            host=host_port[0], port=host_port[1]
        )
        print('Database is ready!')
        break
    except psycopg2.OperationalError:
        print(f'Waiting for database... ({i+1}/30)')
        time.sleep(1)
else:
    print('Database not available after 30 seconds')
    exit(1)
"

echo "Making migrations..."
python manage.py makemigrations tickets --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --reload
