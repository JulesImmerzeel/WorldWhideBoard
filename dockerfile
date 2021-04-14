FROM python:latest-alpine
FROM nginx:latest
FROM redis:latest

RUN mkdir /src

WORKDIR /src

COPY requirements.txt .

RUN pip install -r requirements.txt 


COPY . .

# 8000 for the server 6379 for the redis server
EXPOSE 8000 6379

CMD ["python3", "manage.py", "runserver"]