FROM ruby:3.0

COPY /src /app

RUN cd ./app/ && ruby ./server.rb
