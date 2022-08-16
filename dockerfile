FROM ruby:3.0

COPY src/ .

EXPOSE 4141

CMD echo "Running Ruby Server at http://localhost:4141"
CMD ["ruby", "server.rb"]
