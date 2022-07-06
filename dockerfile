FROM alpine:3.14

RUN apt-get update && apt-get upgrade -y && apt-get install ruby

COPY . /app

RUN ruby /app/server.rb
