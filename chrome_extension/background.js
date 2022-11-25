const key_filepath = "private"

const DOMAIN = 'cpen442project.localhost'
const PORT = '3000'

async function generate_signature(msg) {
    var key = await sign(msg);
    return key
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.route === "generate_signature") {
        console.log(`message before = ${request.message}`);
        generate_signature(request.message).then(sendResponse);
        return true;
    } 
    return false;
})


export async function create_secret() {
    var key = await read_key_from_ls_promise(key_filepath);
    if (!key) {
        key = await generate_key();
        var exported_key = {
            privateKey: await crypto.subtle.exportKey("jwk", key.privateKey),
            publicKey: await crypto.subtle.exportKey("jwk", key.publicKey),
        }
        write_key_to_ls(key_filepath, exported_key);
    } else {
        console.log('Error: key already found');
    }
}

var generate_key = async function() {    
    let keyPair = await crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: "P-256"
        },
        true,
        ["sign", "verify"]
    );
    return keyPair     
}

async function sign(msg) {
    console.log('we in sign');
    var encoder = new TextEncoder();

    var key_pair = await read_key_from_ls_promise(key_filepath);
    if (!key_pair || !key_pair.privateKey) {
        console.log('No private key has been found');
        return msg;
    }
    var private_key = await crypto.subtle.importKey("jwk", key_pair.privateKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);

    console.log('we about to sign');
    console.log(private_key);
    console.log(encoder.encode(msg));

    var result_of_sign = _arrayBufferToBase64(await crypto.subtle.sign({
        name: "ECDSA",
        hash: "SHA-256",
      }, 
      private_key, 
      encoder.encode(msg)))

    console.log(result_of_sign);

    return result_of_sign;
}

var write_key_to_ls = function (id, key) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.set({[id]: key}, function() {
            resolve();
        })
    })
}

var read_key_from_ls_promise = function(id) {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(id, function(result) {
            resolve(result[id]);
        })
    })
}

export async function getPublicKeyFromLS(){
    let key_pair = await read_key_from_ls_promise(key_filepath);

    if(!key_pair)
        return null;

    return key_pair.publicKey;
}

// From https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function _arrayBufferToBase64( buffer ) {
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
}

// From 
function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Gets the public key from server.js for a given handle
async function getPublicKeyAndTime(handle) {
    let publicKey = null;
    try {
        let response = await fetch(`https://${DOMAIN}:${PORT}/public_key/` + handle);
        
        if(response.ok) {
            publicKey = response.json();
        }
    } catch(e) {
        console.log(e)
    } finally {
        return retVal;
    }
}

// Expect base64 signature
async function verifyMsg(handle, msg, signatureBase64){
    let publicKeyAndTime = await getPublicKey(handle);
    let publicKey = publicKeyAndTime.public_key;
    let timePublished = publicKeyAndTime.time_published;
    if(!publicKey)
        return {found: false};
    let signature = _base64ToArrayBuffer(signatureBase64);
    return {
            timePublished: timePublished, 
            found: true, 
            verified: await crypto.subtle.verify({name: "ECDSA", hash: {name: "SHA-256"}}, publicKey, signature, msg)
        };
}
/*
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.route === "verifyMsg") {
        response = await verifyMsg(request.handle, request.msg, request.signature);
        sendResponse(response);

                return true
    }   return false;
})*/
