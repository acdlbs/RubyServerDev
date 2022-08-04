
class Client {
// message list html list
#msgWindow = document.getElementById("msgWindow");
#username;
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

	this.#username = document.getElementById("username").value;
	this.generateKeyPair().then(keyPair => {
	    this.#publicKey = keyPair.publicKey;
	    this.privateKey = keyPair.privateKey;

	    crypto.subtle.exportKey("jwk", this.#publicKey).then((exportedKey) => {


		console.log("sendKeyData");
		this.sendUserInfo(this.#username, exportedKey);
		this.#loggedIn = true;


		    


	    });
	});	
    }



//post message when submitting msg
 submit() {
    var xhr = new XMLHttpRequest();
    
     let message = document.getElementById("message").value;
     console.log(message);

     let encoded = this.encodeMessage(message);

     //console.log(JSON.stringify(console.log(new Uint8Array(encoded))));

     let encodedArray = new Uint8Array(encoded);

     console.log(encodedArray);
     
     this.encryptMessage(this.#publicKey, encodedArray).then((cypherText) => {
	 console.log(cypherText);
	 xhr.open('POST', '/message', true);
	 xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');

	 let c = new Uint8Array(cypherText);
	 
	 let dataToSend = {
	     username: this.#username,
	     message: c
	 };
	 console.log("hereere!!!");
	 console.log(dataToSend);
	 xhr.withCredentials = true;
	 // xhr.send(JSON.stringify(dataToSend));

	 xhr.send(JSON.stringify(dataToSend))
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
//here
 getMessages() {
     let data;
     let pKey = this.privateKey;
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
	if (xhr.readyState == XMLHttpRequest.DONE) {
	    data = JSON.parse(xhr.responseText);
	    console.log("Apple!");
	    console.log(data);
	    const textEncoder = new TextEncoder();


	    // console.log(data);
	    let chatHtml = "<div>";
	    for(let index in data){
		let c = data[index].message;
		console.log(c);
		console.log(Object.keys(c).length);
		let tmp = new Uint8Array(Object.keys(c).length);
		for(let i = 0; i < Object.keys(c).length; i++){
		    tmp[i] = c[i];
		}
		console.log(pKey);
		console.log(tmp);
		window.crypto.subtle.decrypt(
		    {
			name: "RSA-OAEP"
			
		    },
		    pKey,
		    tmp
		    
		).then((decrypted) => {
		    console.log("message = ");
		    console.log(new Uint8Array(decrypted));
		    //let message = this.decodeMessage(decrypted);

		    let dec = new TextDecoder();
		    let message = dec.decode(decrypted);

		    console.log(message);
		    chatHtml += "<li>" + data[index].username + ": " + message + "</li>";
		    chatHtml += "</div>";
		    // console.log(html);
		    msgList.innerHTML = chatHtml;
		    console.log(chatHtml);
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
    console.log("error is in error function");
    window.location.replace("/");
    
}

async  sendUserInfo(username, exportedPubKey) {
    var that = this;

        let xhr = new XMLHttpRequest();
	xhr.open("POST", "/UserAdd?" + that.#username, true);


	xhr.onreadystatechange = function () {
	    // In local files, status is 0 upon success
	    if(xhr.readyState === XMLHttpRequest.DONE) {
		const status = xhr.status;
		if (status === 0 || (status >= 200 && status < 400)) {
		    // The request has been completed successfully
		    console.log(xhr.responseText);
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
	    console.log(this.#loggedIn);
	    if (this.#loggedIn) {
		this.addChatHTMLFeatures()

		var msgList = document.getElementById("msgList");
		// set interval to request new messages
		const interval = setInterval(function() {
		    let data;
		    let xhr = new XMLHttpRequest();
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
	xhr.open("DELETE", this.#username, true);
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



