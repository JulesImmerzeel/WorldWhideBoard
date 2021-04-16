FROM python:3.8-buster
ENV PYTHONUNBUFFERED=1
RUN mkdir /src

WORKDIR /src

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .
RUN chmod +x manage.py
# 8888 for the server 6379 for the redis server
EXPOSE 8888

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8888"]
