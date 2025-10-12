var passwordEntered;

window.addEventListener("load", () => {

  const introContent = `
    <div>
      <p>In order to view the project, you will need to do two things:</p>
      <ul>
        <li>
          Enter the password, which you should have gotten from me:
          <br>
          <input type="password" id="txtPassword" placeholder="Enter the password here">
        </li>
        <li>
          Download the dataset used for this project:
          <br>
          TODO: PUT LINK HERE
          <br>
          Take a quick look at the data file, then you'll upload it for processing.
        </li>
      </ul>
      <div style="text-align:center">
        <input id="btnProject" type="button" value="Go to Project">
      </div>
    </div>
  `;

  const hideModal = showModal("Welcome my AI Capstone Project!", introContent);
  document.querySelector("#btnProject").addEventListener("click", () => {
    passwordEntered = document.querySelector("#txtPassword").value;
    hideModal();
  })

  
  function showModal(title, content){
    const modal = document.createElement("div");
    modal.classList.add("overlay");
    modal.innerHTML = `<div class="modalWindow">
                        <div class="titleBar">
                          <h2 class="title">${title}</h2>
                          <!--<span class="closeButton">X</span>-->
                        </div>
                        <div class="modalContent">
                        ${content}
                        </div>
                      </div>`;
    
    document.body.append(modal);

    function hideModal(){
      document.body.removeChild(modal);
      closeButton.removeEventListener("click", hideModal)
    }

    //const closeButton = modal.querySelector(".closeButton");
    //closeButton.addEventListener("click", hideModal);

    return hideModal;

  }



})