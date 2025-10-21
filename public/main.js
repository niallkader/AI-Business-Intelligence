var passwordEntered;

window.addEventListener("load", () => {

  const introContent = `
    <div>
      <p>
        For this project, we were given a dataset of company sales. We had to
        process this data and display it in charts. Then we had to create an agentic workflow
        that analyzes the data and provides business insights.
      </p>
      <p>In order to view the project, you will need to do two things:</p>
      <ol>
        <li>
          Enter the password, which you should have gotten from me:
          <br>
          <input type="password" id="txtPassword" placeholder="Enter the password here">
          <br><br>
        </li>
        <li>
          Download the dataset used for this project:
          <br>
          <a id="csv-link" href="/sales_data.csv">
            <img src="/excel-icon.png" alt="Excel icon">&nbsp;&nbsp;Click to download the sales data file
          </a>
          <br>
          Take a quick look at the data file, you'll upload it for processing when you go to the project.
        </li>
      </ol>
      <div>
        <input id="btnProject" type="button" value="Go to Project">
      </div>
    </div>
  `;

  const hideModal = showModal("Welcome My AI Capstone Project!", introContent);
  const txtPassword = document.querySelector("#txtPassword");
  txtPassword.focus();
  
  document.querySelector("#btnProject").addEventListener("click", () => {
    passwordEntered = txtPassword.value;
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
      //closeButton.removeEventListener("click", hideModal)
    }

    // I removed the close button for this specific project
    //const closeButton = modal.querySelector(".closeButton");
    //closeButton.addEventListener("click", hideModal);

    // return the hideModal function so that we can hide the modal (without the close button)
    return hideModal;

  }



})