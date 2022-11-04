import { create_secret } from "./background.js"

let generation_button = document.getElementById("generation-btn");

generation_button.addEventListener('click', async() => {
  create_secret();
  const new_para = document.createElement('p');
  new_para.innerText = "Key-pair generated successfully!"
  document.querySelector('#popup-container').appendChild(new_para);
})