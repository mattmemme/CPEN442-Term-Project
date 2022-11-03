//import { create_secret } from "./background.js"

let generation_button = document.getElementById("generation-btn");

generation_button.addEventListener('click', async() => {
  
  console.log("Before calling create_secret!");

  //create_secret();

  console.log("After calling create_secret!");
  
  //chrome.runtime.sendMessage({});



  //create_secret();
  const new_para = document.createElement('p');
  new_para.innerText = "Key-pair generated successfully!"
  document.querySelector('#popup-container').appendChild(new_para);
})