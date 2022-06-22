require 'socket'
require 'json'
require './cache.rb'

#port we are listening on
server = TCPServer.new(4141)
puts "Listening on port 4141"

 messages = FifoCache.new(10)
# messages = Queue.new

loop {
  #get our inital connection
  #client = server.accept
  Thread.start(server.accept) do |client|
    #client = server.accept
    puts Thread.current
    #grab verbage and path requested
    method, path = client.gets.split
    
    puts method
    puts path

    #swap based on verbage
    case method
    when 'GET'
      #serve content based on path
      if (path == '/script.js')
        #load file
        respjs = File.read('./script.js')
        #grab header
        headersjs = ["HTTP/1.1 201 OK",
                     "Server: Ruby",
                     "Content-Type: application/javascript; charset=utf-8",
                     "Sending: javascript",
                     "Content-Length: #{respjs.length}\r\n\r\n"].join("\r\n")
        #serve content
        client.puts(headersjs)
        client.puts(respjs)

      #return message data structure as json
      elsif (path == '/messages')
        resp = []
        messages.data().each {|msg| resp.push(msg)}
        resp = resp.to_json
        
        
        #grab headers'
        headers = ["HTTP/1.1 200 OK",
                   "Server: Ruby",
                   "Content-Type:  json",
                   "Sending: json",
                   "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")


        #send to client
        client.puts(headers)
        client.puts(resp)
      else
        #load file
        resp = File.read('./index.html')

        #grab headers
        headers = ["HTTP/1.1 200 OK",
                   "Server: Ruby",
                   "Content-Type: text/html; charset=utf-8",
                   "Sending: html",
                   "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")


        #send to client
        client.puts(headers)
        client.puts(resp)
      end

      
    when 'POST'
      reqHeaders = {}

      #parse request headers and data
      puts client.gets

      while  line = client.gets
        break if line == "\r\n"
        splitLine = line.split(": ")
        reqHeaders[splitLine[0]] = splitLine[1].strip
      end

      puts reqHeaders

      data = client.read(reqHeaders["Content-Length"].to_i)

      #puts data
      #puts client.gets

      respHeaders = ["HTTP/1.1 200 OK"]

      #print the headers
      client.puts(respHeaders)
      messages.add(JSON.parse(data))
      puts messages
      for i in 0..messages.size
        puts messages.get(i)
      end

    end

    client.close

    Thread.kill(Thread.current)
  end
}

