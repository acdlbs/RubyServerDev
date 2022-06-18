function submit() {
    var xhr = new XMLHttpRequest();

    let message = document.getElementById("message").value;
    
    xhr.open('POST', '/', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    let dataToSend = {
	"firstName": "joe",
	"lastName": "smith",
	"data": message
    };

    console.log(dataToSend);
    
    xhr.send(JSON.stringify(dataToSend));
    document.getElementById("message").value = "";
}
