FROM ruby:3.0

COPY /src /app

RUN cd ./app/src/ && ruby ./server.rb
