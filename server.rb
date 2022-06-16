require 'socket'

socket = TCPServer.new(4141)
puts "Listening on port 4141"


loop {
  
  client = socket.accept


  method, path = client.gets.split
  
  puts method
  puts path
  
  case method
  when 'GET'
    resp = File.read('./index.html')

    headers = ["HTTP/1.1 200 OK",
             "Server: Ruby",
             "Content-Type: text/html; charset=utf-8",
             "Blah: fdsjkfjdsklfjdsklfjdklsjf",
             "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")
  
    client.puts(headers)
    client.puts(resp)
  when 'POST'
    reqHeaders = {}
    
    while line = client.gets.split(' ', 2)
      break if line[0] == ""
      reqHeaders[line[0].chop] = line[1].strip
    end
    data = client.read(reqHeaders["Content-Length"].to_i)
    
    puts data

    respHeaders = ["HTTP/1.1 200 OK"]
    
    client.puts(respHeaders)
  end
  # while line = client.gets
  #   puts line
  # end
 
  
  # resp = '{"desc":{"someKey":"someValue","anotherKey":"value"},"main_item":{"stats":{"a":8,"b":12,"c":10}}}'

  # headers = ["HTTP/1.1 200 OK",
  #            "Server: Ruby",
  #            "Content-Type: text/html; charset=utf-8",
  #            "Blah: fdsjkfjdsklfjdsklfjdklsjf",
  #            "Content-Length: #{resp.length}\r\n\r\n"].join("\r\n")
  
  # client.puts(headers)
  # client.puts(resp)
  client.close
}

