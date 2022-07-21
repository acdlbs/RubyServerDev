// message list html list
var msgWindow = document.getElementById("msgWindow");
var username;
var publicKey;
var privateKey;
// window.onerror = (message, source, lineno, colno, error) => {
    
//     alert(message);
//     window.location.replace("/");
// }
// when user connects with a username

function sendKeyData() {
    username = document.getElementById("username").value;
    generateKeyPair().then(keyPair => {
	publicKey = keyPair.publicKey;
	privateKey = keyPair.privateKey;

	crypto.subtle.exportKey("jwk", publicKey).then((exportedKey) => {

	    try{
		sendUserInfo(username, exportedKey);
	    } catch (e) {
		console.log("butts");
	    }

	});
    });
}
						       

function connect() {
    
    sendKeyData();
    
    addChatHTMLFeatures()

    var msgList = document.getElementById("msgList");
    // set interval to request new messages
    const interval = setInterval(function() {
	let data;
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = getMessages();
    }, 1000);
    
    // 	}).catch((err) => {
    // 	    throw err;
    // 	});
    // }).catch((err) => {
    // 	console.log("cheesenug");
    // 	window.location.replace("/");
    // 	return;
    // });
}

function disconnect() {
    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", username, true);
    xhr.withCredential = true;
    xhr.send(null);
    window.location.replace("/");
}

//post message when submitting msg
function submit() {
    var xhr = new XMLHttpRequest();
    
    let message = document.getElementById("message").value;
    
    xhr.open('POST', '/message', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

    let dataToSend = {
	username: username,
	data: message
    };
    console.log(dataToSend);
    xhr.withCredentials = true;
    // xhr.send(JSON.stringify(dataToSend));
    xhr.send(JSON.stringify(dataToSend))
    document.getElementById("message").value = "";
}

function getMessages() {
    let data;
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (xhr.readyState == XMLHttpRequest.DONE) {
	    data = JSON.parse(xhr.responseText);
	    // console.log(data);
	    let chatHtml = "<div>";
	    for(let index in data){
		chatHtml += "<li>" + data[index].username + ": " + data[index].data + "</li>";
	    }
	    chatHtml += "</div>";
	    // console.log(html);
	    msgList.innerHTML = chatHtml;
	    // alert(JSON.stringify(xhr.responseText));
	}
    }
    xhr.open('GET', '/messages', true);
    xhr.withCredentials = true;
    xhr.send(null);
}

function addChatHTMLFeatures() {
    let connectionWindowHtml = "<h2>Type something</h2><div class=\"chatBox\"><ul style=\"list-style-type:none;\" id=\"msgList\"></ul><div><input type=\"text\" id=\"message\" name=\"message\"><input type=\"submit\" value=\"Send\" onclick=\"submit()\"></div></div>";
    // console.log(html);
    document.getElementById("user").innerHTML = "";
    var connectionWindow = document.createElement('div');
    connectionWindow.innerHTML = connectionWindowHtml;
    msgWindow.appendChild(connectionWindow);
    var disconnectButton = document.createElement('div');
    disconnectButton.innerHTML = "<input type=\"submit\" value=\"Disconnect\" onclick=\"disconnect()\">";
    msgWindow.appendChild(disconnectButton);
}

function sendUserInfo(username, exportedPubKey) {
    let xhr1 = new XMLHttpRequest();
    try{
	xhr1.onreadystatechange = ((f) => {
	    if (this.readyState == 4 && this.status == 409) {
		throw new Error("Username Taken");
		return;
	    }).catch((e) => {console.log("here");}))
	}
    }
    catch (e) {
	console.log("here");
	throw e;
    }
    xhr1.open("POST", "/UserAdd?" + username, true);
    xhr1.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr1.withCredential = true;
    xhr1.send(JSON.stringify(exportedPubKey));
}


//encryption
async function decryptMessage(key, cyphertext) {
    let decrypted = await window.crypto.subtle.decrypt(
	{
	    name: "RSA-OAEP"
	          
	},
	key,
	ciphertext
	    
    );   
}

async function encryptMessage(key, encoded) {
    ciphertext = await window.crypto.subtle.encrypt(
	{
	    name: "RSA-OAEP"
	},
	key,
	encoded
	    
    );
    return ciphertext;
}

function encodeMessage(message) {
    let enc = new TextEncoder();
    return enc.encode(message);
}

function decodeMessage(message) {
    let dec = new TextDecoder();
    return dec.decode(message);
}

async function generateKeyPair() {
    return window.crypto.subtle.generateKey(
	{
	    name: "RSA-OAEP",
	    modulusLength: 2048,
	    publicExponent: new Uint8Array([1, 0, 1]),
	    hash: "SHA-256",
	},
	true,
	["encrypt", "decrypt"]
	
    );
}
