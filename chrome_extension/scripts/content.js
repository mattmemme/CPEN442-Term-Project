function getSignature(msg) {
    console.log("Copied to Clipboard again");
    chrome.runtime.sendMessage({route: "generate_signature", message: msg}, function(response) {
        console.log(response);
        navigator.clipboard.writeText(response);
        console.log("Copied to Clipboard");
    });
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function handleCommand(event) {
    var tweetTextElements = document.getElementsByClassName(tweetTextClass);
    var tweetTextElement = tweetTextElements[0]
    var msg = tweetTextElement.firstElementChild.innerText;
    getSignature(msg);
}

const tweetButtonClass = ".css-1dbjc4n.r-l5o3uw.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-19u6a5r.r-2yi16.r-1qi8awa.r-icoktb.r-1ny4l3l.r-ymttw5.r-o7ynqc.r-6416eg.r-lrvibr"
const tweetTextClass = "public-DraftStyleDefault-block public-DraftStyleDefault-ltr"
const elemBarClass = "css-1dbjc4n r-1awozwy r-18u37iz r-1s2bzr4"

waitForElm(tweetButtonClass).then((elm) => {
    console.log('Element is ready');
    var elemBar = document.getElementsByClassName(elemBarClass);
    newElem = elemBar[0].children[2].cloneNode(true)
    elemBar[0].lastChild.insertAdjacentElement("beforebegin", newElem)
    elemBar[0].children[6].firstChild.firstChild.firstChild.innerHTML = `<path d="M0.017,23.462c-0.011,0.14,0.037,0.275,0.132,0.378C0.243,23.942,0.376,24,0.516,24H13.59c0.139,0,0.272-0.058,0.367-0.16
    c0.094-0.103,0.143-0.239,0.131-0.378c-0.232-3.082-1.894-4.849-5.072-5.393V17h0.5c0.275,0,0.5-0.225,0.484-0.5v-2
    c0.016-0.276-0.209-0.5-0.484-0.5h-5c-0.276,0-0.5,0.224-0.5,0.5v2c0,0.275,0.224,0.5,0.5,0.5h0.5v1.069
    C1.887,18.608,0.25,20.376,0.017,23.462z"/>
    <path d="M23.283,0.427c-0.195-0.195-0.512-0.195-0.707,0l-2.561,2.56V0.5c0-0.173-0.09-0.335-0.236-0.425
        c-0.147-0.092-0.33-0.101-0.486-0.024c-1.053,0.521-2.73,1.631-4.285,3.186c-3.012,3.011-4.334,6.334-3.296,8.049l-1.274,1.274
        c-0.196,0.196-0.196,0.512,0,0.707c0.191,0.193,0.508,0.198,0.706,0l1.266-1.265c0.503,0.333,1.121,0.5,1.815,0.5
        c1.665,0,3.75-0.926,5.627-2.633c0.152-0.139,0.204-0.358,0.13-0.55C19.907,9.127,19.722,9,19.516,9h-4.102l1-1h4.601
        c0.275,0,0.5-0.225,0.5-0.5c0-0.276-0.225-0.5-0.5-0.5h-3.601l1.001-1h4.054c0.179,0,0.345-0.097,0.434-0.252
        c1.282-2.235,1.431-4.195,0.415-5.266C23.305,0.464,23.299,0.443,23.283,0.427z"/>`
    elemBar[0].children[6].onclick = handleCommand
});

console.log("Loaded")
