// message list html list
var msgList = document.getElementById("msgList")

// when window loads
window.onload = () => {
    // set interval to request new messages
    const interval = setInterval(function() {
	let data;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	    if (xhr.readyState == XMLHttpRequest.DONE) {
		data = JSON.parse(xhr.responseText);
		// console.log(data);
		let html = "<div>";
		for(let index in data){
		    html += "<li>" + data[index].username + ": " + data[index].data + "</li>";
		}
		html += "</div>";
		// console.log(html);
		msgList.innerHTML = html;
		// alert(JSON.stringify(xhr.responseText));
	    }
	}
	xhr.open('GET', '/messages', true);
	xhr.send(null);

    }, 1000);
}


//post message when submitting msg
function submit() {
    var xhr = new XMLHttpRequest();

    let user = document.getElementById("username").value;
    let message = document.getElementById("message").value;
    
    xhr.open('POST', '/', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    let dataToSend = {
	username: user,
	data: message
    };
    console.log(dataToSend);
    
    // xhr.send(JSON.stringify(dataToSend));
    xhr.send(JSON.stringify(dataToSend))
    document.getElementById("message").value = "";
}
