const key_filepath = "private"


async function generate_signature(msg) {
    var key = await sign(msg);
    return key
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.route === "generate_keypair") {
        console.log(`message before = ${request.message}`);
        generate_signature(request.message).then(sendResponse);
        return true;
    } 
    return false;
})


async function create_secret() {
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