FROM python:3.8-buster
ENV PYTHONUNBUFFERED=1


WORKDIR /src

COPY requirements.txt .

RUN pip3 install -r requirements.txt
COPY . .
# 8888 for the server 6379 for the redis server
EXPOSE 8888
RUN python3 manage.py collectstatic --settings=doodler.settings_production
CMD ["daphne", "-b", "0.0.0.0", "-p", "8888", "--ws-protocol", "--proxy-headers", "doodler.asgi:application"]
