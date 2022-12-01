import { create_secret, getPublicKeyFromLS, write_key_to_ls } from "./background.js"

const DOMAIN = 'cpen442project.localhost'
const PORT = '3000'
const LAST_ACTION_FILEPATH = "last_action"
const RECOVERY_CODE_FILEPATH = "recovery_code"

// var generation_btn = document.createElement('button');
// generation_btn.id = "generation-btn"
// generation_btn.innerText = "Generate Key-pair"

var generation_btn = document.getElementById("generation-btn");
var update_btn = document.getElementById("update-btn");

// var update_btn = document.createElement('button');
// update_btn.id = "update-btn"
// update_btn.innerText = "Update Keys Using Recovery Codes"

generation_btn.addEventListener('click', async() => {
  
  var response = await fetch(`https://${DOMAIN}:${PORT}/oauth`);
  var signInUrl = (await response.json()).url;

  await write_key_to_ls(LAST_ACTION_FILEPATH, "generation");
  chrome.tabs.create({url: signInUrl});
})


update_btn.addEventListener('click', async() => {
  
  var response = await fetch(`https://${DOMAIN}:${PORT}/oauth`);
  var signInUrl = (await response.json()).url;

  await write_key_to_ls(LAST_ACTION_FILEPATH, "update");
  await write_key_to_ls(RECOVERY_CODE_FILEPATH, document.getElementById("updateCode").value);
  chrome.tabs.create({url: signInUrl});
});