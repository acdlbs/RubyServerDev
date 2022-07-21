require 'socket'
require 'json'
require './cache.rb'

#port we are listening on
server = TCPServer.new(4141)
puts "Listening on port 4141"

messages = FifoCache.new(10)
users = Hash.new()
numUsers = 0

loop {
  puts numUsers
  puts users
  #get our inital connection puts it on a thread
  Thread.start(server.accept) do |client|
    headers = []
    while (line = client.gets) != "\r\n"
      headers << line
    end

    puts headers

    # client.each_line do |line|
    #   puts line
    # end

    puts Thread.current
    #grab verbage and path requested
    method, path = headers[0].split
    host, id = headers[1].split
    
    puts method
    puts path
    puts host
    puts id

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
                     "Access-Control-Allow-Credentials: true",
                     "Sending: javascript",
                     "Content-Length: #{respjs.length}\r\n\r\n"].join("\r\n")
        #serve content
        client.puts(headersjs)
        client.puts(respjs)

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
        
      #return message data structure as json
      elsif (path == '/messages')
        # client.each_line do |line|
        #   puts line
        # end
        resp = []
        messages.data().each {|msg| resp.push(msg)}
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

      
    when 'POST'

      if (path == "/message")
        reqHeaders = {}

        #parse request headers and data
        #puts client.gets
        for line in headers
          puts line
          splitLine = line.split(": ")
          reqHeaders[splitLine[0]] = splitLine[1]
        end
        
        # while  line = client.gets
        #   puts line
        #   break if line == "\r\n"
        #   splitLine = line.split(": ")
        #   reqHeaders[splitLine[0]] = splitLine[1].strip
        # end

        puts reqHeaders

        data = client.read(reqHeaders["Content-Length"].to_i)

        
        respHeaders = ["HTTP/1.1 200 OK"]

        #print the headers
        client.puts(respHeaders)
        messages.add(JSON.parse(data))
        puts messages
        for i in 0..messages.size
          puts messages.get(i)
        end

      else
        if(path.match(/UserAdd/))
          userToCreate = path.match(/(\/UserAdd\?)(.*)/)[2]
          if (!users.has_key?(userToCreate))
            reqHeaders = {}

            #parse request headers and data
            #puts client.gets
            for line in headers
              puts line
              splitLine = line.split(": ")
              reqHeaders[splitLine[0]] = splitLine[1]
            end

            data = client.read(reqHeaders["Content-Length"].to_i)
            respHeaders = ["HTTP/1.1  201 CREATED",
                           "Set-Cookie: id=#{userToCreate}; Secure; HttpOnly,"]
            users[userToCreate] = data
            client.puts(respHeaders)
          else
            respHeaders = ["HTTP/1.1 409 CONFLICT"]
            client.puts(respHeaders)
          end
        end
      end
    when "DELETE"
      reqHeaders = {}
      
      for line in headers
        puts line
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

