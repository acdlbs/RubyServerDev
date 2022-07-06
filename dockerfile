FROM ruby:3.0

COPY . /app

RUN ruby /app/server.rb
