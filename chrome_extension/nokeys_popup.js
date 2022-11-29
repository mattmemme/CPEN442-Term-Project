import { create_secret, getPublicKeyFromLS } from "./background.js"

const DOMAIN = 'cpen442project.localhost'
const PORT = '3000'

// var generation_btn = document.createElement('button');
// generation_btn.id = "generation-btn"
// generation_btn.innerText = "Generate Key-pair"

var generation_btn = document.getElementById("generation-btn");

var update_btn = document.createElement('button');
update_btn.id = "update-btn"
update_btn.innerText = "Update Keys Using Recovery Codes"

generation_btn.addEventListener('click', async() => {
  
  var response = await fetch(`https://${DOMAIN}:${PORT}/oauth`);
  var signInUrl = (await response.json()).url;

  //console.log(signInUrl);

  chrome.tabs.create({url: signInUrl});

  // chrome.windows.create({url: signInUrl}, win => {
  //   if (win.tabs.length) {
  //     const firstTab = win.tabs[0];
  //     if (firstTab.url !== signInUrl) { // the redirect already happen
  //        const redirectURL = win.tabs[0].url;
  //        // Do something with the redirect URL
  //     } else {// the redirect hasn't happen yet, listen for tab changes.
  //        function updateListener(tabId, tab) {
  //         console.log('we are in the updateListener');
  //          if (tabId == firstTab.id && tab.url !== signInUrl) {
  //           console.log('we are in the conditional');
  //            const redirectURL = tab.url;
  //            // Do something with the redirect URL
  //            chrome.windows.remove(win.id); // Close the window.
  //            chrome.tabs.onUpdated.removeListener(updateListener);
  //          }
  //        }
  //        chrome.tabs.onUpdated.addListener(updateListener);
  //     }
  //   }
  // })

  //await create_secret();
  //window.close();

  // const publishKeyOptions = {
  //   method: 'POST',
  //   headers: {
  //   'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     pubKey: await getPublicKeyFromLS()
  //   }),
  // };

  // var resp = await (await fetch(`https://${DOMAIN}:${PORT}/publish_key`, publishKeyOptions)).json();
  
  // document.remove(generation_btn);
  // const new_para = document.createElement('p');

  // if (resp && resp.recovery_codes) {
  //   new_para.innerText = `Key-pair generated and uploaded successfully! Safely store the recovery code to update key-pair: ${resp.recovery_codes}`
  //   document.remove(update_btn);
  // } else {
  //   new_para.innerText = `A key has already been generated for this user. Please try to update.`
  // }
  
  // document.querySelector('#popup-container').appendChild(new_para);
})

update_btn.addEventListener('click', async() => {
  var recovery_code_field = document.createElement('input');
  var commit_btn = document.createElement('commit-btn');

  document.remove(update_btn);
  document.querySelector('#popup-container').appendChild(recovery_code_field);
  document.querySelector('#popup-container').appendChild(commit_btn);
});