//global vars
var users = new Map;
var username;
var loggedIn = false;
var messages = new Array;


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class Client {

    //class variables
    #publicKey;
    privateKey;

    contructor() {
	loggedIn = false;
    }


    start() {
	this.setReadyListener();
	this.sendKeyData();
    }

    //give the server the users public key
    async sendKeyData() {
	loggedIn = false;

	username = document.getElementById("message").value;
	document.getElementById("message").value = "";
	generateKeyPair().then(keyPair => {
	    this.#publicKey = keyPair.publicKey;
	    this.privateKey = keyPair.privateKey;

	    crypto.subtle.exportKey("jwk", this.#publicKey).then((exportedKey) => {

		console.log("sendKeyData");
		this.sendUserInfo(username, exportedKey);
		loggedIn = true;
		animation();

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
			to: names[i],
			from: username,
			date: Date(),
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

		let chatHtml = "";
		var div;
		
		for(let index in data){

		    //if there is no message continue (this is a fix for a bug that appeared...
		    //sometimes the first message sent when the server is started returns nothing...)
		    if (data[index].length == 0) continue;

		    
		    let msgArray = data[index];

		    var message;

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

			
			let msg = {
			    to: data[index][0].to,
			    from: data[index][0].from,
			    date: data[index][0].date,
			    message: message
			}
			
			let tmp = messages.filter((item) => {return _.isEqual(msg, item)});
			
			if (tmp.length == 0) {
			    messages.push(msg);
			    chatHtml = "<li>" + data[index].filter(u => u.to == username)[0].from + ": " + message + "</li>";
			    $( "p.msgBox" ).append( chatHtml );
			}

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
	let connectionWindowHtml = "";
	document.getElementById("message").innerHTML = "";
	var connectionWindow = document.createElement('div');
	connectionWindow.innerHTML = connectionWindowHtml;
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
	    //console.log(loggedIn);
	    if (loggedIn) {
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


var input = document.getElementById('message');
input.focus();
input.select();
input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
	input = document.getElementById("message").value;
	if (input == "/disconnect") client.disconnect(); 
	loggedIn ? client.submit() : connect();
	//client.submit();
    }
});



async function animation() {

    document.getElementById("intro").innerHTML = "";

    var data = [
	{
	    disconnect: 
	    "<p class=\"font\">Type /disconnect to disconnect</p>",
	    welcome: 
	    "<p class=\"font\">Welcome " + username + " </p>",
	    loading:
	    "<p class=\"font\">Loading</p>",
	    one:
	    "<p class=\"font\">InfoChat</p>",
	    two:
	    "<p class=\"font\">Classic chat with end to end encryption</p>",
	    three:
	    "<p class=\"font\">Version 1.0</p>",
	    four:
	    "<p class=\"font\">2022</p>",
	    five:
	    "<p class=\"font\">root@21d120ecd1c0:/# ./InfoChat</p><br/>"
	}
    ];


    terminalPrint("one", data, 30);
    sleep(500).then(()=> {
	terminalPrint("two", data, 30);
	sleep(1500).then(()=> {
	    terminalPrint("three", data, 30);
	    sleep(500).then(()=> {
		terminalPrint("four", data, 30);
		sleep(500).then(()=> {
		    terminalPrint("five", data, 30);
			sleep(3000).then(()=>{
			    terminalPrint("welcome", data, 60);
			    sleep(1000).then(()=> {
				terminalPrint("disconnect", data, 60);
			    })
			})
		})
	    })
	})
    })
    
    

    
	
}

function terminalPrint(HTMLclass, data, speed){
    var allElements = document.getElementsByClassName(HTMLclass);
	for (var j = 0; j < allElements.length; j++) {
	    var currentElementId = allElements[j].id;
	    var currentElementIdContent = data[0][currentElementId];
	    var element = document.getElementById(currentElementId);
	    var devTypeText = currentElementIdContent;

	    // type code
	    var i = 0, isTag, text;
	    (function type() {
		text = devTypeText.slice(0, ++i);
		if (text === devTypeText) return;
		element.innerHTML = text + `<span class='blinker'>&#32;</span>`;
		var char = text.slice(-1);
		if (char === "<") isTag = true;
		if (char === ">") isTag = false;
		if (isTag) return type();
		setTimeout(type, speed);
	    })();
	}}
