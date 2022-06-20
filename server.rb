require 'socket'
require 'json'

#port we are listening on
socket = TCPServer.new(4000)
puts "Listening on port 4000"


loop {

  #get our inital connection
  client = socket.accept


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
     reqHeaders[line.split(": ")[0]] = line.split(": ")[1].strip
    end

    puts reqHeaders

    data = client.read(reqHeaders["Content-Length"].to_i)

    puts data
    #puts client.gets

    respHeaders = ["HTTP/1.1 200 OK"]

    #print the headers
    client.puts(respHeaders)
  end

  client.close
}

