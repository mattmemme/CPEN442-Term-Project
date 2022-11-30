chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.route === "append_recovery_codes") {
        console.log('we are about to attempt to add recovery codes');
        var codesNode = document.createTextNode(request.codes.toString());
        var recoveryDiv = document.getElementById('recovery-codes-div');
        recoveryDiv.appendChild(codesNode);
        console.log('we should have added the recovery codes');
        return true;
    }
    return false;
})