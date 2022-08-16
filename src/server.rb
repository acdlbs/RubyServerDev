require 'socket'
require 'json'
require './cache.rb'
require 'byebug'

#port we are listening on
server = TCPServer.new(4141)
puts "Listening on port 4141"

messages = FifoCache.new(10)
users = Hash.new()
numUsers = 0

loop {
  
  #get our inital connection puts it on a thread
  Thread.start(server.accept) do |client|
    headers = []
    while (line = client.gets) != "\r\n"
      headers << line
    end

    #grab verbage and path requested
    method, path = headers[0].split
    host, id = headers[1].split

    #headers.each {|l| puts l}

    
    #puts method
    #puts path
    #puts host
    #puts id

    #swap based on verbage
    case method
    when 'GET'
      #client side javascript
      if (path == '/script.js')
        #load file
        respjs = File.read('./script.js')
        #grab header
        headersjs = ["HTTP/1.1 201 OK",
                     "Server: Ruby",
                     "Content-Type: application/javascript; charset=utf-8",
                     "Access-Control-Allow-Credentials: true",
                     "Sending: javascript",
                     "Content-Length: #{respjs.length}\r\n\r\n"].join("\r\n")
        #serve content
        client.puts(headersjs)
        client.puts(respjs)

      #page css
      elsif (path == '/style.css')
        #load file
        respcss = File.read('./style.css')
        #grab header
        headerscss = ["HTTP/1.1 201 OK",
                      "Server: Ruby",
                      "Content-Type: text/css; charset=utf-8",
                      "Access-Control-Allow-Credentials: true",
                      "Sending: css",
                      "Content-Length: #{respcss.length}\r\n\r\n"].join("\r\n")
        #serve content
        client.puts(headerscss)
        client.puts(respcss)

      #return the user array
      elsif (path == '/users')
        resp = []
        users.each {|user| resp.push(user)}
        resp = resp.to_json
        
        
        #grab headers'
        headers = ["HTTP/1.1 200 OK",
                   "Server: Ruby",
                   "Content-Type:  json",
                   "Access-Control-Allow-Credentials: true",
                   "Sending: json",
                   "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")

        
        #send to client
        client.puts(headers)
        client.puts(resp)
        
      #return message data structure as json
      elsif (path == '/messages')
        # client.each_line do |line|
        #   puts line
        # end
        #puts headers
        resp = []
        messages.data().map {|msg| msg.select {|m| m["to"]==headers.filter {|msg| msg[..5] == "Cookie"}.first.chomp[11..]}}.filter {|a| !a.empty?}.map{|msg| resp.push(msg)}
        #messages.get(1).select {|msg| resp.push(msg["username"] == headers.last.chomp[11..])}
        #messages.data().each {|msg| resp.push(msg)}
        #puts resp
        #byebug
        resp = resp.to_json
        
        
        #grab headers'
        headers = ["HTTP/1.1 200 OK",
                   "Server: Ruby",
                   "Content-Type:  json",
                   "Access-Control-Allow-Credentials: true",
                   "Sending: json",
                   "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")


        #send to client
        client.puts(headers)
        client.puts(resp)
      #otherwise give the HTML
      else
        #load file
        resp = File.read('./index.html')

        #grab headers
        headers = ["HTTP/1.1 200 OK",
                   "Server: Ruby",
                   "Content-Type: text/html; charset=utf-8",
                   "Sending: html",
                   "Access-Control-Allow-Credentials: true",
                   "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")


        #send to client
        client.puts(headers)
        client.puts(resp)
      end

    #POST
    when 'POST'

      #when a user posts a message store in messages object
      if (path == "/message")
        reqHeaders = {}

        for line in headers
          splitLine = line.split(": ")
          reqHeaders[splitLine[0]] = splitLine[1]
        end

        data = client.read(reqHeaders["Content-Length"].to_i)

        respHeaders = ["HTTP/1.1 200 OK"]

        client.puts(respHeaders)
        messages.add(JSON.parse(data))

      #otherwise add a new user
      else
        if(path.match(/UserAdd/))
          userToCreate = path.match(/(\/UserAdd\?)(.*)/)[2]
          if (!users.has_key?(userToCreate))
            reqHeaders = {}

            #parse request headers and data
            for line in headers
              splitLine = line.split(": ")
              reqHeaders[splitLine[0]] = splitLine[1]
            end

            data = client.read(reqHeaders["Content-Length"].to_i)
            respHeaders = ["HTTP/1.1  201 CREATED",
                           "Set-Cookie: id=#{userToCreate}; Secure; HttpOnly,"]
            users[userToCreate] = data
            client.puts(respHeaders)
            
          #return conflict if user already has that name
          else
            respHeaders = ["HTTP/1.1 409 CONFLICT"]
            client.puts(respHeaders)
          end
        end
      end
    #delete user 
    when "DELETE"
      reqHeaders = {}
      
      for line in headers
        #puts line
        splitLine = line.split(": ")
        reqHeaders[splitLine[0]] = splitLine[1]
      end

      data = client.read(reqHeaders["Content-Length"].to_i)

      respHeaders = ["HTTP/1.1 200 OK"]
      
      path.slice! "/"

      users.delete(path)

      client.puts(respHeaders)

    end

    client.close

    Thread.kill(Thread.current)
  end
}

