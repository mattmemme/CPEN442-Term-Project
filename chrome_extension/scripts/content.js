// Send message to background script to get signature
function getSignature(msg) {
    console.log("Copied to Clipboard again");
    chrome.runtime.sendMessage({route: "generate_signature", message: msg}, function(response) {
        console.log(response);

        var snackbar = document.getElementById('snackbar');
        if (msg.charCodeAt(0) == 10) {
          snackbar.innerText = "Message cannot be empty!";
        }
        else if (response.localeCompare(msg) == 0) {
          snackbar.innerText = "Key does not exist! Click extension icon."
        }
        else {
          navigator.clipboard.writeText(response);
          snackbar.innerText = "Copied to clipboard!";
        }
        snackbar.className = "show";
        setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
    });
}

// Function to wait for an element to be added to the DOM
function waitForNElms(selector, n) {
    return new Promise(resolve => {
        if (n === 1 && document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        } else if (n !== 1 && document.querySelectorAll(selector).length === n) {
            return resolve(document.querySelectorAll(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (n === 1 && document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            } else if (n !== 1 && document.querySelectorAll(selector).length === n) {
                resolve(document.querySelectorAll(selector))
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
}

function createButton(elemBar, new_btn_id) {
    newElem = elemBar[0].children[2].cloneNode(true)
    elemBar[0].lastChild.insertAdjacentElement("beforebegin", newElem)
    elemBar[0].children[6].firstChild.firstChild.firstChild.innerHTML = `<path ` + ink_pen_icon.d1 + `/>
    <path ` + ink_pen_icon.d2 + `/>`
    elemBar[0].children[6].onclick = handleClick;
    elemBar[0].children[6].id = new_btn_id;
}

function drawSnackBar() {
    var snackbar = document.createElement('div');
    snackbar.id = "snackbar";
    snackbar.innerText = "Copied to Clipboard";
    document.getElementsByTagName('body')[0].appendChild(snackbar);
}

function handleClick(event) {
    var tweetTextElements = document.getElementsByClassName(tweetTextClass);
    var tweetTextElement = tweetTextElements[0];
    var msg = tweetTextElement.firstElementChild.innerText;
    getSignature(msg);
}

function getVerifiedIcon(tweet_text) {
    // PLACEHOLDER
    // TODO: Replace this with code that actually verifies tweet
    let x = tweet_text.length % 3;
    if (x == 1) {
        // Missing signature
        return `<path fill="#F1F500" ${warning_icon.d1}/>
        <path fill="#F1F500" ${warning_icon.d2}/>
        <circle fill="#F1F500" ${warning_icon.circle}/>`
    }
    else if (x == 2) {
        // Success
        return `<path fill="#2FFF0E" ${verified_icon.d1}/>
        <path fill="#2FFF0E" ${verified_icon.d2}/>`
    }
    else {
        // Failure
        return `<path fill="#FF390E" ${invalid_icon.d1}/>
        <path fill="#FF390E" ${invalid_icon.d2}/>`
    }
}

function checkTweets() {
    let tweets = document.getElementsByClassName("css-1dbjc4n r-1iusvr4 r-16y2uox r-1777fci r-kzbkwu");
    for (let i = 0; i < tweets.length; i++) {
        let tweet = tweets[i];

        // Insert icon if it does not exist
        let tweet_bar = tweet.getElementsByClassName("css-1dbjc4n r-1ta3fxp r-18u37iz r-1wtj0ep r-1s2bzr4 r-1mdbhws")[0];
        if (!tweet_bar.getElementsByClassName("auth-icon").length) {
            // Get icon colour based on tweet text
            let tweet_text_span = tweet.getElementsByClassName("css-901oao css-16my406 r-poiln3 r-bcqeeo r-qvutc0")[0];
            let tweet_text = tweet_text_span;

            // Add new element
            let new_elem = tweet_bar.lastChild.cloneNode(true);
            new_elem.firstChild.setAttribute("class", "auth-icon");
            tweet_bar.lastChild.insertAdjacentElement("afterend", new_elem);

            // Change icon and set colour
            let svg_icon = new_elem.getElementsByTagName("g")[0]
            svg_icon.innerHTML = getVerifiedIcon(tweet_text.innerHTML);
        }
    }
}

const tweetButtonClass = ".css-1dbjc4n.r-l5o3uw.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-19u6a5r.r-2yi16.r-1qi8awa.r-icoktb.r-1ny4l3l.r-ymttw5.r-o7ynqc.r-6416eg.r-lrvibr"
const tweetTextClass = "public-DraftStyleDefault-block public-DraftStyleDefault-ltr"
const elemBarClass = "css-1dbjc4n r-1awozwy r-18u37iz r-1s2bzr4"
/*
const observer = new MutationObserver(mutations => {
    console.log("Change detected")
});
observer.observe(document.body, {
    childList: true,
    subtree: true
});
*/

waitForNElms('[aria-label="Tweet"]', 1).then((new_tweet_btn) => {
    console.log("New tweet btn loaded!")
    new_tweet_btn.onclick = function() {

        waitForNElms('[aria-label="Add photos or video"]', 2).then((upload_media_btns) => {
            console.log("Two btn bars!")
            var elem_bar = document.getElementsByClassName(elemBarClass);
            createButton(elem_bar, 'sign-btn-popup')
        })
    }
})

// Wait for template button to be inserted into DOM
waitForNElms('[aria-label="Home timeline"]', 1).then((home_timeline) => {

    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
                console.log('A child node has been added or removed!')
                
                var upload_media_btn = document.querySelector('[aria-label="Add photos or video"]');
                var sign_btn = document.getElementById('sign-btn');

                if (upload_media_btn && sign_btn === null) {
                    var elem_bar = document.getElementsByClassName(elemBarClass);
                    createButton(elem_bar, 'sign-btn');
                    drawSnackBar();
                }
            }
        }
    }
    const observer = new MutationObserver(callback);
    observer.observe(home_timeline, { childList: true, subtree: true })
})

setInterval(checkTweets, 1000)

console.log("Loaded")

const ink_pen_icon = {
    d1: `d="M0.017,23.462c-0.011,0.14,0.037,0.275,0.132,0.378C0.243,23.942,0.376,24,0.516,24H13.59c0.139,0,0.272-0.058,0.367-0.16
    c0.094-0.103,0.143-0.239,0.131-0.378c-0.232-3.082-1.894-4.849-5.072-5.393V17h0.5c0.275,0,0.5-0.225,0.484-0.5v-2
    c0.016-0.276-0.209-0.5-0.484-0.5h-5c-0.276,0-0.5,0.224-0.5,0.5v2c0,0.275,0.224,0.5,0.5,0.5h0.5v1.069
    C1.887,18.608,0.25,20.376,0.017,23.462z"`,
    d2: `d="M23.283,0.427c-0.195-0.195-0.512-0.195-0.707,0l-2.561,2.56V0.5c0-0.173-0.09-0.335-0.236-0.425
    c-0.147-0.092-0.33-0.101-0.486-0.024c-1.053,0.521-2.73,1.631-4.285,3.186c-3.012,3.011-4.334,6.334-3.296,8.049l-1.274,1.274
    c-0.196,0.196-0.196,0.512,0,0.707c0.191,0.193,0.508,0.198,0.706,0l1.266-1.265c0.503,0.333,1.121,0.5,1.815,0.5
    c1.665,0,3.75-0.926,5.627-2.633c0.152-0.139,0.204-0.358,0.13-0.55C19.907,9.127,19.722,9,19.516,9h-4.102l1-1h4.601
    c0.275,0,0.5-0.225,0.5-0.5c0-0.276-0.225-0.5-0.5-0.5h-3.601l1.001-1h4.054c0.179,0,0.345-0.097,0.434-0.252
    c1.282-2.235,1.431-4.195,0.415-5.266C23.305,0.464,23.299,0.443,23.283,0.427z"`
};

const verified_icon = {
    d1: `d="M23.623,0.218c-0.433-0.344-1.062-0.271-1.405,0.161L9.416,16.501l-4.207-4.207c-0.391-0.391-1.024-0.391-1.414,0
    c-0.391,0.392-0.391,1.024,0,1.414l5,5c0.188,0.188,0.442,0.293,0.707,0.293c0.019,0,0.038-0.001,0.057-0.002
    c0.285-0.016,0.549-0.153,0.727-0.376l13.5-17C24.127,1.19,24.056,0.562,23.623,0.218z"`,
    d2: `d="M18.551,11.021c-0.538,0.123-0.875,0.659-0.752,1.197c0.134,0.585,0.202,1.185,0.202,1.783c0,4.411-3.589,8-8,8
    c-4.411,0-8-3.589-8-8s3.589-8,8-8c1.248,0,2.444,0.28,3.555,0.832c0.494,0.247,1.095,0.044,1.341-0.451
    c0.246-0.494,0.044-1.095-0.451-1.34c-1.39-0.691-2.885-1.041-4.445-1.041c-5.514,0-10,4.485-10,10c0,5.514,4.486,10,10,10
    c5.514,0,10-4.486,10-10c0-0.748-0.085-1.498-0.252-2.229C19.626,11.234,19.091,10.896,18.551,11.021z"`
}

const invalid_icon = {
    d1: `d="M11.5,0C5.159,0,0,5.159,0,11.5S5.159,23,11.5,23S23,17.841,23,11.5S17.841,0,11.5,0z M11.5,22C5.71,22,1,17.29,1,11.5
		S5.71,1,11.5,1S22,5.71,22,11.5S17.29,22,11.5,22z"`,
    d2: `d="M16.096,6.904c-0.195-0.195-0.512-0.195-0.707,0L11.5,10.793L7.61,6.904c-0.195-0.195-0.512-0.195-0.707,0
		s-0.195,0.512,0,0.707l3.889,3.889l-3.889,3.889c-0.195,0.195-0.195,0.512,0,0.707c0.098,0.098,0.226,0.146,0.354,0.146
		s0.256-0.049,0.354-0.146l3.89-3.889l3.889,3.889c0.098,0.098,0.226,0.146,0.354,0.146s0.256-0.049,0.354-0.146
		c0.195-0.195,0.195-0.512,0-0.707L12.207,11.5l3.889-3.889C16.291,7.416,16.291,7.1,16.096,6.904z"`
}

const warning_icon = {
    d1: `d="M11,9.153v7.652c0,0.277,0.224,0.5,0.5,0.5s0.5-0.223,0.5-0.5V9.153c0-0.276-0.224-0.5-0.5-0.5S11,8.877,11,9.153z"`,
    d2: `d="M22.892,23.166L11.947,1.276c-0.17-0.339-0.725-0.339-0.895,0l-11,22c-0.077,0.155-0.069,0.339,0.021,0.486
		C0.166,23.91,0.327,24,0.5,24h22c0.007,0,0.015,0,0.02,0c0.276,0,0.5-0.224,0.5-0.5C23.02,23.372,22.972,23.254,22.892,23.166z
		 M1.309,23L11.5,2.618L21.691,23H1.309z"`,
    circle: `cx="11.5" cy="20" r="1"`
}
