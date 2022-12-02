// TODO: extract these into a constants file maybe?
const key_filepath = "private"
const LAST_ACTION_FILEPATH = "last_action"
const RECOVERY_CODE_FILEPATH = "recovery_code"

const DOMAIN = 'cpen442project.localhost'
const PORT = '3000'

async function generate_signature(msg) {
    var key = await sign(msg);
    return key
}

function generateSuccessHTML(recoveryCodes) {
    return `javascript:\'<!doctype html><html>
        <head></head>
        <body>
            <div id="recovery-codes-div">
                <h1>Congratulations, you are all set</h1>
                <p>Please securely store the recovery codes found below:</p>
                <p>${recoveryCodes}</p>
                <p>These codes will be needed to regenerate your key if it becomes lost or compromised.</p>
            </div>
        </body>
    </html>\'`
}

function updateSuccessHTML(numRecoveryCodes) {
    return `javascript:\'<!doctype html><html>
        <head></head>
        <body>
            <div id="recovery-codes-div">
                <h1>Congratulations, your public key has been reset</h1>
                <p>You have ${numRecoveryCodes} valid recovery codes remaining</p>
                <p>These codes will be needed to regenerate your key if it becomes lost or compromised.</p>
            </div>
        </body>
    </html>\'`
}

function updateFailHTML() {
    return `javascript:\'<!doctype html><html>
        <head></head>
        <body>
            <div id="recovery-codes-div">
                <h1>Oops, something went wrong</h1>
                <p>Unable to reset key</p>
            </div>
        </body>
    </html>\'`
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
    getPublicKeyFromLS().then(pubKey => {
        console.log('pubKey is ');
        console.log(pubKey);
        if (!pubKey) {
            chrome.action.setPopup({popup: "nokeys_popup.html"});
        } else {
            chrome.action.setPopup({popup: "haskeys_popup.html"});
        }
    });
});

async function onSuccessfulSignin(tabId, changeInfo, tab) {
    if (tab.url.includes('cpen442project.localhost:3000/callback') && 
            changeInfo.status === "complete") {
        
        console.log('we are in successfulSignin')

        chrome.tabs.remove(tabId);
        // chrome.tabs.onUpdated.removeListener(onSuccessfulSignin);
        
        var lastAction = await read_key_from_ls_promise(LAST_ACTION_FILEPATH);

        if (lastAction === "generation") {
            publishKey();
        } else if (lastAction === "update") {
            var recoveryCode = await read_key_from_ls_promise(RECOVERY_CODE_FILEPATH);
            updateKey(recoveryCode);
        } else {
            console.log("invalid last action");
        }
    }
}

chrome.tabs.onUpdated.addListener(onSuccessfulSignin);

async function updateKey(recoveryCode) {
    var key = await generate_key();
    var exported_key = {
        privateKey: await crypto.subtle.exportKey("jwk", key.privateKey),
        publicKey: await crypto.subtle.exportKey("jwk", key.publicKey),
    }

    if (!recoveryCode) {
        console.log("no recovery code found");
        return;
    }

    const updateKeyOptions = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        newPubKey: exported_key.publicKey,
        recoveryCode: recoveryCode
        }),
    };

    var resp = await fetch(`https://${DOMAIN}:${PORT}/reset_key`, updateKeyOptions);

    if (!resp.ok) {
        console.log("Key already exists. Returning from callBackFinished");
        await chrome.tabs.create({url: updateFailHTML()})
        return;
    }

    console.log('we have proceeded....why');

    write_key_to_ls(key_filepath, exported_key);

    resp = await resp.json();

    if (resp && resp.numRecoveryCodes) {
        await chrome.tabs.create({url: updateSuccessHTML(resp.numRecoveryCodes)})
    } else {
        console.log('response from publishKey endpoint does not contain all the necessary fields');
    }
}

async function publishKey() {
    var key = await generate_key();
    var exported_key = {
        privateKey: await crypto.subtle.exportKey("jwk", key.privateKey),
        publicKey: await crypto.subtle.exportKey("jwk", key.publicKey),
    }

    const publishKeyOptions = {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        pubKey: exported_key.publicKey
        }),
    };

    var resp = await fetch(`https://${DOMAIN}:${PORT}/publish_key`, publishKeyOptions);
    
    if (!resp.ok) {
        console.log("Key already exists. Returning from callBackFinished");
        return;
    }

    write_key_to_ls(key_filepath, exported_key);

    resp = await resp.json();

    if (resp && resp.recovery_codes) {
        await chrome.tabs.create({url: generateSuccessHTML(resp.recovery_codes.toString().replaceAll(',', ', '))})
    } else {
        console.log('response from publishKey endpoint does not contain all the necessary fields');
    }
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

// TODO: Make this agnostic of key, just mkae it a write to ls
export var write_key_to_ls = function (id, key) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.set({[id]: key}, function() {
            resolve();
        })
    })
}

// TODO: Make this agnostic of key, just mkae it a read from ls
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
