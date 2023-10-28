function getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function customTimeForm(t) {
  const timestamp = new Date(parseInt(t));
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are 0-indexed
  const day = String(timestamp.getDate()).padStart(2, '0');
  const hours = String(timestamp.getHours()).padStart(2, '0');
  const minutes = String(timestamp.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function createPopup(mainUrl, enableButton) {
  const popupOverlay = document.createElement("div");
  popupOverlay.id = "myPopupOverlay";
  Object.assign(popupOverlay.style, styleConfig.popupOverlay);

  const viewportWidth = window.innerWidth;

  const popupWidthPercentage = 30; // Adjust this percentage as needed
  const popupWidth = (viewportWidth * popupWidthPercentage) / 100 + "px";
  popupOverlay.style.width = popupWidth;

  // Create a title bar
  const titleBar = document.createElement("div");
  Object.assign(titleBar.style, styleConfig.titleBar);

  // Add a close button to the title bar
  const closeButton = document.createElement("button");
  closeButton.id = "closeButton7354";
  closeButton.textContent = "Close";
  Object.assign(closeButton.style, styleConfig.closeButton);

  // Add the title bar and close button to the overlay
  titleBar.appendChild(document.createTextNode("Previously Bookmarked Intervals"));
  titleBar.appendChild(closeButton);
  popupOverlay.appendChild(titleBar);

  document.body.appendChild(popupOverlay);
  const cb = document.getElementById('closeButton7354');
  cb.addEventListener("click", function () {
    const historyButton = document.getElementById('historyButton7354');
    enableButton(historyButton);
    //historyButton.disabled=false;
    //historyButton.style.backgroundColor = 'Grey';
    popupOverlay.remove();
  });

  const mainVideoId = urlToVideoId(mainUrl);

  // Create the outer list
  const outerList = document.createElement("ul");
  //outerList.style.listStyleType = 'none';
  outerList.style.backgroundColor = 'rgba(173, 216, 230, 0.5)';


  chrome.runtime.sendMessage({ type: 'getall' }, function (response) {
    //console.log(response);

    // Group bookObjects by videoId
    const groups = {};
    response.forEach(bookObject => {
      if (!groups[bookObject.videoId]) {
        groups[bookObject.videoId] = [];
      }
      groups[bookObject.videoId].push(bookObject);
    });

    const sortedGroups = Object.entries(groups).sort((groupA, groupB) => {
      const largestTimestampA = Math.max(...groupA[1].map(bookObject => bookObject.timestamp));
      const largestTimestampB = Math.max(...groupB[1].map(bookObject => bookObject.timestamp));
    
      // Check if the first video's videoId matches mainVideoId
      const firstVideoIdA = groupA[1][0].videoId;
      const firstVideoIdB = groupB[1][0].videoId;
    
      if (firstVideoIdA === mainVideoId && firstVideoIdB !== mainVideoId) {
        return -1; // groupA comes first
      } else if (firstVideoIdB === mainVideoId && firstVideoIdA !== mainVideoId) {
        return 1; // groupB comes first
      } else {
        return largestTimestampB - largestTimestampA; // Sort by largest timestamp
      }
    });


    // Create a list for each group
    for (const [videoId, bookObjects] of sortedGroups) {
      // Create a list for the group and append it to the outer list
      createList(mainVideoId, outerList, bookObjects);
    }
  });

  // Append the outer list to the popupOverlay
  popupOverlay.appendChild(outerList);
}


function createList(mainVideoId, container, bookObjects) {
  bookObjects.sort((a, b) => b.timestamp - a.timestamp);

  const list = document.createElement("li");
  list.style.marginLeft = '1em';
  list.style.listStyleType = 'none';

  if(bookObjects.length>0){
    //console.log(bookObjects[0].videoId, mainVideoId);
    //const headingElement = document.createElement("h3");
    const paragraph = document.createElement("p");
    const link = document.createElement("a");
    link.textContent = 'https://youtu.be/'+bookObjects[0].videoId;
    link.href = bookObjects[0].url;
    link.style.marginRight = '10px';
    paragraph.appendChild(link);

    if (bookObjects[0].videoId === mainVideoId) {
      const thisVideoText = document.createTextNode(" (This video)");
      const boldText = document.createElement("span");
      boldText.style.fontWeight = 'bold';
      boldText.style.backgroundColor = 'gold';
      boldText.appendChild(thisVideoText);
      paragraph.appendChild(boldText);
    }
    container.appendChild(paragraph);
  }


  bookObjects.forEach((bookObject, i) => {
    const listItem = document.createElement("li");
    listItem.style.marginBottom = '1em';
    if(i>0) listItem.style.color = 'grey';
  
    const table = document.createElement("table");
    table.style.border = 'none';
    //table.style.backgroundColor = 'lightblue';
  
    const tableRow = document.createElement("tr");
  

    const spaceCell1 = document.createElement("td");
    spaceCell1.appendChild(document.createTextNode('\u00A0\u00A0'));
    tableRow.appendChild(spaceCell1);
  
    const nameCell = document.createElement("td");
    const nameText = document.createTextNode(bookObject.name + '.');
    nameCell.appendChild(nameText);
    tableRow.appendChild(nameCell);
  
    const spaceCell2 = document.createElement("td");
    spaceCell2.appendChild(document.createTextNode('\u00A0\u00A0'));
    tableRow.appendChild(spaceCell2);
  
    const mssCell = document.createElement("td");
    const mssElement = document.createElement("span");
    mssElement.textContent = bookObject.mss;
    mssCell.appendChild(mssElement);
    tableRow.appendChild(mssCell);
  
    const spaceCell3 = document.createElement("td");
    spaceCell3.appendChild(document.createTextNode('\u00A0\u00A0'));
    tableRow.appendChild(spaceCell3);
  
    const deleteCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.innerText = 'Delete';
    deleteButton.addEventListener('click', function () {
      chrome.runtime.sendMessage({ type: 'delete', payload: bookObject });
      listItem.remove();
    });
    deleteCell.appendChild(deleteButton);
    tableRow.appendChild(deleteCell);
  
    table.appendChild(tableRow);
    listItem.appendChild(table);
    list.appendChild(listItem);
  });

  container.appendChild(list);
  const hr = document.createElement('hr');
  hr.style.border = 'none';
  hr.style.borderTop = '2px solid #fff'; // Grey border
  container.appendChild(hr);
}


const styleConfig = {
  popupOverlay: {
    position: "fixed",
    top: "0",
    right: "0",
    fontSize: "1.5em",
    height: "100%",
    background: "white",
    boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
    zIndex: "9999",
    //flexDirection: "column",
    minWidth: "30%", // Set a minimum width for the popup overlay
    overflow: "auto",
  },
  titleBar: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "0.5em", // Adjust padding using em (e.g., "1em")
    display: "flex",
    justifyContent: "space-between",
  },
  closeButton: {
    background: "grey",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
};


