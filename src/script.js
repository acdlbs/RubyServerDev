//global vars
var users = new Map;
var username;

class Client {

    //class variables
    #msgWindow = document.getElementById("msgWindow");
    //#username;
    #publicKey;
    privateKey;
    #loggedIn;

    contructor() {
	this.#loggedIn = false;
    }


    start() {
	this.setReadyListener();
	this.sendKeyData();
    }

    //give the server the users public key
    sendKeyData() {
	this.#loggedIn = false;

	username = document.getElementById("username").value;
	generateKeyPair().then(keyPair => {
	    this.#publicKey = keyPair.publicKey;
	    this.privateKey = keyPair.privateKey;

	    crypto.subtle.exportKey("jwk", this.#publicKey).then((exportedKey) => {

		console.log("sendKeyData");
		this.sendUserInfo(username, exportedKey);
		this.#loggedIn = true;
	    });
	});	
    }



    //post message when submitting msg
    submit() {
	var xhr = new XMLHttpRequest();
	
	let message = document.getElementById("message").value;

	let encoded = encodeMessage(message);

	//encode
	let encodedArray = new Uint8Array(encoded);
	
	let sendingTo = new Array();

	const names = [];

	//promises collects all the promises of creating an encryped message
	//we can call Promise.all(promises).then((result)=>{}) to run once all promises have returned
	const promises = [];
	
	//for each of the users encrypt message with their pub key
	users.forEach((key, user) => {

	    console.log(user);

	    names.push(user);
	    
	    promises.push(encryptMessage(key, encodedArray));
	});

	//when all promises finish send all the encrypted messages
	Promise.all(promises)
            .then((result) => {
		for (let i = 0; i < result.length; i++) {
		    let c = new Uint8Array(result[i]);
		    
		    let dataToSend = {
			username: names[i],
			from: username,
			message: c
		    };

		    sendingTo.push(dataToSend);
		}
		
		xhr.open('POST', '/message', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		
		xhr.withCredentials = true;

		xhr.send(JSON.stringify(sendingTo))

		//set the message form back to empty
		document.getElementById("message").value = "";
	    });
    }

    //grab the users from the server
    getUsers() {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	    if (xhr.readyState == XMLHttpRequest.DONE) {
		let data = JSON.parse(xhr.responseText);

		//for each of the users map a name to a public key (stored in the users map)
		data.forEach((currentValue, index, arr) => {
		    let name = currentValue[0];
		    let key = JSON.parse(currentValue[1]);
		    window.crypto.subtle.importKey(
			"jwk",
			key,
			{   //these are the algorithm options
			    name: "RSA-OAEP",
			    hash: {name: "SHA-256"},
			},
			true, 
			["encrypt"]
		    ).then(function(publicKey){
			    //set the map
			    users.set(name, publicKey);
			}).catch(function(err){
			    console.error(err);
			});
		})
	    }
	}
	
	xhr.open('GET', '/users', true);
	xhr.withCredentials = true;
	xhr.send(null);
    }

    //get the user messages from the server and insert the unencrypted messages as html
    getMessages() {
	let data;
	let pKey = this.privateKey;
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	    if (xhr.readyState == XMLHttpRequest.DONE) {
		data = JSON.parse(xhr.responseText);

		const textEncoder = new TextEncoder();

		//let chatHtml = "<div>";
		let chatHtml = "";
		for(let index in data){

		    //if there is no message continue (this is a fix for a bug that appeared...
		    //sometimes the first message sent when the server is started returns nothing...)
		    if (data[index].length == 0) continue;

		    
		    let b = data[index];

		    var message;
		    var msgArray = data[index].filter(u => u.username == username);
		    if (msgArray.length == 0){
			continue;
		    } else {
			message = msgArray[0].message;
		    }
		   
		    
		    
		    if (message == null) {
			console.log(index);
		    }
		    
		    
		    let encrypted = new Uint8Array(Object.keys(message).length);
		    for(let i = 0; i < Object.keys(message).length; i++){
			encrypted[i] = message[i];
		    }


		    window.crypto.subtle.decrypt(
			{
			    name: "RSA-OAEP"
			    
			},
			pKey,
			encrypted
			
		    ).then((decrypted) => {
			let dec = new TextDecoder();
			let message = dec.decode(decrypted);

			//collect the html
			chatHtml += "<li>" + data[index].filter(u => u.username == username)[0].from + ": " + message + "</li>";
			
			//chatHtml += "</div>";
			// console.log(html);
			
			//shove the html into index.html
			msgList.innerHTML = chatHtml;

		    })
		}
	    }
	}
	xhr.open('GET', '/messages', true);
	xhr.withCredentials = true;
	xhr.send(null);
    }

    //once user is connected update the html with the chatbox and messages
    addChatHTMLFeatures() {
	let connectionWindowHtml = "<h2>Type something</h2><div class=\"chatBox\"><ul style=\"list-style-type:none;\" id=\"msgList\"></ul><div><input type=\"text\" id=\"message\" name=\"message\"><input type=\"submit\" value=\"Send\" onclick=\"client.submit()\"></div></div>";
	document.getElementById("user").innerHTML = "";
	var connectionWindow = document.createElement('div');
	connectionWindow.innerHTML = connectionWindowHtml;
	this.#msgWindow.appendChild(connectionWindow);
	var disconnectButton = document.createElement('div');
	disconnectButton.innerHTML = "<input type=\"submit\" value=\"Disconnect\" onclick=\"client.disconnect()\">";
	this.#msgWindow.appendChild(disconnectButton);
    }

    error() {
	window.location.replace("/");
	throw "User is already active";
    }

    //send the current user and their public key to the server
    async sendUserInfo(username, exportedPubKey) {
        let xhr = new XMLHttpRequest();
	xhr.open("POST", "/UserAdd?" + username, true);

	xhr.onreadystatechange = function () {
	    // In local files, status is 0 upon success
	    if(xhr.readyState === XMLHttpRequest.DONE) {
		const status = xhr.status;
		if (status === 0 || (status >= 200 && status < 400)) {
		    // The request has been completed successfully
		    //console.log(xhr.responseText);
		} else {
		    window.location.replace("/");
		}
	    }
	};
	
	xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	xhr.withCredential = true;
	xhr.send(JSON.stringify(exportedPubKey));
    }


    setReadyListener() {
	var that = this;
	const readyListener = () => {
	    //console.log(this.#loggedIn);
	    if (this.#loggedIn) {
		this.addChatHTMLFeatures()

		var msgList = document.getElementById("msgList");
		// set interval to request new messages
		const interval = setInterval(function() {
		    let data;
		    let xhr = new XMLHttpRequest();
		    xhr.onreadystatechange = that.getUsers();
		    xhr.onreadystatechange = that.getMessages();
		}, 1000);
		return;
		return alert("Ready!");
	    }
	    return setTimeout(readyListener, 250);
	};
	readyListener();
    }

    disconnect() {
	let xhr = new XMLHttpRequest();
	xhr.open("DELETE", username, true);
	xhr.withCredential = true;
	xhr.send(null);
	window.location.replace("/");
    }
};

function connect() {
    client = new Client();
    client.start();
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

async function  encryptMessage(key, encoded) {
    return await window.crypto.subtle.encrypt(
	{
	    name: "RSA-OAEP"
	},
	key,
	encoded
	
    );
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
