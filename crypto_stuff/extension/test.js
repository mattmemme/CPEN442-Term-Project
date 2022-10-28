var generate_key = async function() {
    // Check that key is not already generated...
    read_key_from_ls("private");
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

var sign = async function(msg, key) {
    return (sign({
        name: "ECDSA",
        hash: {name: "SHA-384"},
      }, 
      key, 
      msg))
}


var write_key_to_ls = function (id, key) {
    chrome.storage.local.set({[id]: key}, function() {
        console.log(`We be setting key = ${key}`);
    })
}

var read_key_from_ls = async function (id) {
    chrome.storage.local.get(id, function(obj) {
        alert(obj[id]);
    });
}




// var main = async function() {
//     let keypair = await generate_key();


//     console.log(await window.crypto.subtle.exportKey("pkcs8", keypair.privateKey));
//     console.log(await window.crypto.subtle.exportKey("pkcs8", keypair.publicKey));
// }


let generateButton = window.document.getElementById("generate");
let msgInput = window.document.getElementById("msg");
let sendButton = window.document.getElementById("send-msg");

generateButton.addEventListener("click", function() {
    read_key_from_ls("private");
});


sendButton.addEventListener("click", function() {
    let msg = msgInput.value;
    write_key_to_ls("private", msg);
});

// main();
