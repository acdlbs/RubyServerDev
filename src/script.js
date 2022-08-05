
var users = new Map;
var username;

class Client {
    // message list html list
    #msgWindow = document.getElementById("msgWindow");
//    #username;
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
    
    sendKeyData() {
	this.#loggedIn = false;

	username = document.getElementById("username").value;
	this.generateKeyPair().then(keyPair => {
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
	//console.log(message);

	let encoded = this.encodeMessage(message);

	//console.log(JSON.stringify(console.log(new Uint8Array(encoded))));

	let encodedArray = new Uint8Array(encoded);

	//console.log(encodedArray);
	
	let sendingTo = new Array();

	const names = [];
	const promises = [];
	

	//console.log(users);
	users.forEach((key, user) => {

	    console.log(user);
	    
	    

	    names.push(user);
	    promises.push(this.encryptMessage(key, encodedArray));


	    /*
	      .then((cypherText) => {
		//console.log(cypherText);
		let c = new Uint8Array(cypherText);
		
		let dataToSend = {
		    username: user,
		    message: c
		};

		sendingTo.push(dataToSend);

	    })
	      */
	});

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

		console.log("here!!!");
		console.log(sendingTo);
		
		xhr.open('POST', '/message', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		
		//console.log("hereere!!!");
		//console.log(dataToSend);
		xhr.withCredentials = true;
		// xhr.send(JSON.stringify(dataToSend));

		xhr.send(JSON.stringify(sendingTo))
		document.getElementById("message").value = "";
	    });


    

	
	

	/*
	  async  encryptMessage(key, encoded) {
	  ciphertext = await window.crypto.subtle.encrypt(
	  {
	  name: "RSA-OAEP"
	  },
	  key,
	  encoded
	  
	  );
	  return ciphertext;
	  }

	  encodeMessage(message) {
	  let enc = new TextEncoder();
	  return enc.encode(message);
	  }
	*/
	
    }
    getUsers() {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
	    if (xhr.readyState == XMLHttpRequest.DONE) {
		let data = JSON.parse(xhr.responseText);
		//console.log("FOO");
		//console.log(data);

		data.forEach((currentValue, index, arr) => {
		    let name = currentValue[0];
		    let key = JSON.parse(currentValue[1]);
		    //console.log(name);
		    //console.log(key);
		    window.crypto.subtle.importKey(
			"jwk", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
			key,
			{   //these are the algorithm options
			    name: "RSA-OAEP",
			    hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
			},
			true, //whether the key is extractable (i.e. can be used in exportKey)
			["encrypt"] //"encrypt" or "wrapKey" for public key import or
			//"decrypt" or "unwrapKey" for private key imports
		    )
			.then(function(publicKey){
			    //returns a publicKey (or privateKey if you are importing a private key)
			    //console.log(publicKey);
			    users.set(name, publicKey);
//			    console.log(name + "\n" + publicKey);
			})
			.catch(function(err){
			    console.error(err);
			});
		    
		    //console.log(index);

		})
		
		// Client.decryptMessage(pKey, data[index].message).then((message) => {
		
		// })
	    }
	    // alert(JSON.stringify(xhr.responseText));
	}
	
	xhr.open('GET', '/users', true);
	xhr.withCredentials = true;
	xhr.send(null);
    }
    //here
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

		    if (data[index].length == 0) continue;
		    console.log(data[index]);

		    let b = data[index];
		    
		    //let c = data[index].message;

//		    console.log(data[index][0].message);
//		    data[1].filter(k => k.username == username)

		    var c;
		    var msgArray = data[index].filter(u => u.username == username);
		    if (msgArray.length == 0){
			continue;
		    } else {
			c = msgArray[0].message;
		    }
		   
		    
		    
		    if (c == null) {
			console.log(index);
		    }
		    
		    
		    let tmp = new Uint8Array(Object.keys(c).length);
		    for(let i = 0; i < Object.keys(c).length; i++){
			tmp[i] = c[i];
		    }


		    window.crypto.subtle.decrypt(
			{
			    name: "RSA-OAEP"
			    
			},
			pKey,
			tmp
			
		    ).then((decrypted) => {


			//let message = this.decodeMessage(decrypted);

			let dec = new TextDecoder();
			let message = dec.decode(decrypted);


			chatHtml += "<li>" + data[index].filter(u => u.username == username)[0].from + ": " + message + "</li>";
			//chatHtml += "</div>";
			// console.log(html);
			msgList.innerHTML = chatHtml;

		    })
		    
		    // Client.decryptMessage(pKey, data[index].message).then((message) => {
		    
		    // })
		}
		// alert(JSON.stringify(xhr.responseText));
	    }
	}
	xhr.open('GET', '/messages', true);
	xhr.withCredentials = true;
	xhr.send(null);
    }

    addChatHTMLFeatures() {

	let connectionWindowHtml = "<h2>Type something</h2><div class=\"chatBox\"><ul style=\"list-style-type:none;\" id=\"msgList\"></ul><div><input type=\"text\" id=\"message\" name=\"message\"><input type=\"submit\" value=\"Send\" onclick=\"client.submit()\"></div></div>";
	// console.log(html);
	document.getElementById("user").innerHTML = "";
	var connectionWindow = document.createElement('div');
	connectionWindow.innerHTML = connectionWindowHtml;
	this.#msgWindow.appendChild(connectionWindow);
	var disconnectButton = document.createElement('div');
	disconnectButton.innerHTML = "<input type=\"submit\" value=\"Disconnect\" onclick=\"client.disconnect()\">";
	this.#msgWindow.appendChild(disconnectButton);
    }


    
    error() {
	//console.log("error is in error function");
	window.location.replace("/");
	
    }

    async  sendUserInfo(username, exportedPubKey) {
	var that = this;

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
		    // alert("blah");
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

	
	// let xhr1 = new XMLHttpRequest();
	
	// xhr1.onreadystatechange = Function () {
	// 	// In local files, status is 0 upon success
	// 	if(xhr1.readyState === XMLHttpRequest.DONE) {
	// 	    const status = xhr1.status;
	// 	    if (status === 0 || (status >= 200 && status < 400)) {
	// 		// The request has been completed successfully
	// 		console.log(xhr1.responseText);
	// 		console.log("hey");
	// 		this.#loggedIn = true;
	// 	    } else {
	// 		// alert("blah");
	// 		window.location.replace("/");
	// 	    }
	// 	}
	// };
	
	// xhr1.open("POST", "/UserAdda?" + this.#username, true);
	// xhr1.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	// xhr1.withCredential = true;
	// xhr1.send(JSON.stringify(exportedPubKey))
    }


    //encryption
    async  decryptMessage(key, cyphertext) {
	let decrypted = await window.crypto.subtle.decrypt(
	    {
		name: "RSA-OAEP"
	        
	    },
	    key,
	    ciphertext
	    
	);   
    }

    async  encryptMessage(key, encoded) {
	return await window.crypto.subtle.encrypt(
	    {
		name: "RSA-OAEP"
	    },
	    key,
	    encoded
	    
	);
    }

    encodeMessage(message) {
	let enc = new TextEncoder();
	return enc.encode(message);
    }

    decodeMessage(message) {
	let dec = new TextDecoder();
	return dec.decode(message);
    }

    async  generateKeyPair() {
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
    
    
    // 	}).catch((err) => {
    // 	    throw err;
    // 	});
    // }).catch((err) => {
    // 	console.log("cheesenug");
    // 	window.location.replace("/");
    // 	return;
    // });
}



