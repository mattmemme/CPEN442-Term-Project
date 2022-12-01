import { write_key_to_ls } from "./background.js"

const DOMAIN = 'cpen442project.localhost'
const PORT = '3000'
const LAST_ACTION_FILEPATH = "last_action"
const RECOVERY_CODE_FILEPATH = "recovery_code"

var update_btn = document.getElementById("update-btn");

update_btn.addEventListener('click', async() => {
  
    console.log("we are attempting to update our keys")

    var response = await fetch(`https://${DOMAIN}:${PORT}/oauth`);
    var signInUrl = (await response.json()).url;

    await write_key_to_ls(LAST_ACTION_FILEPATH, "update");
    await write_key_to_ls(RECOVERY_CODE_FILEPATH, document.getElementById("update-input").value);
    chrome.tabs.create({url: signInUrl});
});