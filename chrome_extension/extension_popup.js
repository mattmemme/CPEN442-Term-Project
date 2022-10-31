// import create_secret from "scripts/content.js"

let generation_button = document.getElementById("generation-btn");
generation_button.addEventListener('click', async() => {
  console.log("Generation button clicked!");
  //create_secret();
  const new_para = document.createElement('p');
  new_para.innerText = "Key-pair generated successfully!"
  document.querySelector('#popup-container').appendChild(new_para);
})