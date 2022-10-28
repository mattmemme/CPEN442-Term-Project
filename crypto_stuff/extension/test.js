// From https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

var send_message = async function() {
    let msg = msgInput.value;
    var signature = await sign(msg);
    
    console.log(signature);
    console.log(msg);
    console.log(_arrayBufferToBase64(signature));

}

var create_secret = async function() {
    var key = await read_key_from_ls_promise("private");
    if (!key) {
        key = await generate_key();
        console.log("Key generated");
        console.log(key.privateKey);
        var exported_key = {
            privateKey: await window.crypto.subtle.exportKey("jwk", key.privateKey),
            publicKey: await window.crypto.subtle.exportKey("jwk", key.publicKey),
        }
        console.log('this is exported_key after generation');
        console.log(exported_key)
        write_key_to_ls("private", exported_key);
        console.log("Created exportable key");
    } else {
        console.log('had key already');
    }
}


var generate_key = async function() {    
    let keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256"
        },
        true,
        ["sign", "verify"]
    );
    return keyPair     
}

var sign = async function(msg) {
    var encoder = new TextEncoder();
    console.log(`encoder`);
    var encoded = encoder.encode(msg)
    console.log(encoded);


    var key_pair = await read_key_from_ls_promise('private');
    var private_key = await window.crypto.subtle.importKey("jwk", key_pair.privateKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);

    console.log(private_key);
    return (await window.crypto.subtle.sign({
        name: "ECDSA",
        hash: "SHA-256",
      }, 
      private_key, 
      encoded));
}


var write_key_to_ls = function (id, key) {
    chrome.storage.local.set({[id]: key}, function() {
        console.log(`We be setting key`);
        console.log(key);
    })
}

var read_key_from_ls_promise = function(id) {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(id, function(result) {
            console.log(result);
            resolve(result[id]);
        })
    })
}

let generateButton = window.document.getElementById("generate");
let msgInput = window.document.getElementById("msg");
let sendButton = window.document.getElementById("send-msg");

generateButton.addEventListener("click", function() {
    create_secret();
});


sendButton.addEventListener("click", function() {
    send_message();
});
