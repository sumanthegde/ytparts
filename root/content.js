var pageUrl = undefined;
var intervals = []; 
var lastStart = undefined;
var imin = undefined;
var adState = undefined;
var oldAdState = undefined;
const subTDivId = 'subTDiv7354';
const tCopyId = 'tCopy7354';
const inputElementId = 'intervalInput7354';
const submitButtonId = 'submitButton7354';
const deleteButtonId = 'deleteButton7354';
const loopId = 'loopCheckbox7354';
const shinerId = 'shiner7354';
const bookmarkId = 'bookmark7354';
const historyId = 'historyButton7354';

function timeupdateHandler(){
  if(adState) return;
  const video = document.querySelector('video');
  let repeat = document.getElementById(loopId).checked;
  let n = intervals.length;
  if(n==0 && repeat==true && video.currentTime > video.duration-0.1){
    video.currentTime=0;
    return;
  }
  for (let i=imin; i<n; i++){
    const [open,close] = intervals[i];
    const cur = video.currentTime; //
    if(lastStart <= close && close+1 < cur){
      imin = repeat ? (i+1)%n : i+1;
      if(cur < close+2){ // interval overshoot
        video.currentTime = imin == n ? video.duration : intervals[imin][0];
        break;
      }
    }
  }
}

function seekedHandler(){
  const video = document.querySelector('video');
  if(adState){
    console.log("seeked but ad is showing. t=", video.currentTime);
    return;
  }
  let t = video.currentTime;
  lastStart = t-0.25; // without -0.25, the condition (lastStart <= close) may fail, when open==close.
  imin = 0;
}

function submitIntervalsOnEnter(event){
  if (event.key === 'Enter')
    submitIntervals();
}

function submitIntervals() {
  const intervalsStr = document.getElementById(inputElementId).value;
  if (intervalsStr.trim()===''){
    invokeIntervals([]);
    return;
  }
  if (intervalsStr.length>200){
    alert("Input too long.");
    return;
  }
  const pattern = /^\s*[0-9.:\s]+-[0-9.:\s]+(,\s*[0-9.:\s]+-[0-9.:\s]+)*\s*$/
  if (!pattern.test(intervalsStr)){
    alert('Input format should be startTime-endTime,startTime-endTime,... etc. Example: "00:30 - 00:45, 1:55 - 2:05" (without quotes)');
    return;
  }
  const intervalsRaw = intervalsStr.split(',').map(intervalStr => intervalStr.split('-').map(timeStr => parseTime(timeStr)));
  if(intervalsRaw.some(interval => isNaN(interval[0]) || isNaN(interval[1]) || interval[0] > interval[1])){
    alert("Ensure startTime ≤ endTime, and that timestamps are in h:m:s or m:s or s format.");
    return;
  }
  const video = document.querySelector('video');
  video.removeEventListener("seeked", seekedHandler);
  video.removeEventListener("timeupdate", timeupdateHandler);
  video.addEventListener("seeked", seekedHandler);
  video.addEventListener("timeupdate", timeupdateHandler);
  invokeIntervals(intervalsRaw);
}

function submitIntervals2(){
  const video = document.querySelector('video');
  video.removeEventListener("seeked", seekedHandler);
  video.removeEventListener("timeupdate", timeupdateHandler);
  video.addEventListener("seeked", seekedHandler);
  video.addEventListener("timeupdate", timeupdateHandler);
 
  invokeIntervals();
}

function invokeIntervals(intervalsRaw){
  const video = document.querySelector('video');
  const t = video.currentTime;
  if(t>0.1 && !adState){
    const maxt = Math.trunc(video.duration)-1;
    const intervalsCapped = intervalsRaw.map(([start,end]) => [start>maxt ? maxt:start, end>maxt ? maxt:end]);
    intervals = mergeAndSortIntervals(intervalsCapped);
    imin = 0;
    if(intervals.length>0){
      const t1 = intervals.length > 0 ? intervals[0][0] : 0;
      video.currentTime = t1;
      console.log("invoked. t was " + t + ", now " + t1);
    }
    showAndFadeShiner();
  }else
    setTimeout(invokeIntervals,100,intervalsRaw);
}

function showAndFadeShiner() {
  var shiner = document.getElementById(shinerId);
  var deleteButton = document.getElementById(deleteButtonId);
  var markButton = document.getElementById(bookmarkId);
  shiner.style.opacity = '1';
  shiner.style.transition = 'opacity 2s';
  shiner.innerText = 'Applied:';
  if(intervals.length > 0){
    shiner.innerText += ' ' + msfy(intervals).replaceAll(',', ', ');
    enableButton(deleteButton);
    enableButton(markButton);
  }else{
    shiner.innerText += ' ' + 'None';
    disableButton(deleteButton);
    disableButton(markButton);
  }
  setTimeout(function () {
    shiner.style.opacity = '0.5';
  }, 2000);
}

function adStateTrack() {
  var mutationCallback = function(mutationsList) {
    for (var mutation of mutationsList) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        var moviePlayer = document.getElementById("movie_player");
        if (moviePlayer) {
          adState = moviePlayer.classList.contains("ad-showing");
          if (adState !== oldAdState) {
            oldAdState = adState;
            const inputElement = document.getElementById(inputElementId);
            const submitButton = document.getElementById(submitButtonId);
            const deleteButton = document.getElementById(deleteButtonId);
            if(adState){
              submitButton.removeEventListener('click', submitIntervals);
              inputElement.removeEventListener('keydown', submitIntervalsOnEnter);
              disableButton(submitButton);
              disableButton(deleteButton);
            }else{
              submitButton.addEventListener('click', submitIntervals);
              inputElement.addEventListener('keydown', submitIntervalsOnEnter);
              enableButton(submitButton);
              if(intervals.length>0) 
                enableButton(deleteButton);
            }
            console.log("ad: ", adState);
          }
        }
      }
    }
  };
  var observer = new MutationObserver(mutationCallback);
  var moviePlayer = document.getElementById("movie_player");
  if (moviePlayer) 
    observer.observe(moviePlayer, { attributes: true, attributeFilter: ['class'] });
}

function handleNewUrl() {
  intervals = []; 
  lastStart = -1;
  imin = 0;
  const placeholder = 'e.g. 0:30-0:45, 1:15-1:30';
  const inputElement = document.getElementById(inputElementId);
  const submitButton = document.getElementById(submitButtonId);
  const deleteButton = document.getElementById(deleteButtonId);
  const markButton = document.getElementById(bookmarkId);
  const shiner = document.getElementById(shinerId);
 
  function handleInput() {
    disableButton(markButton);
  }

  function handleDelete(){
    inputElement.value = '';
    submitIntervals();
  }

  shiner.innerText = 'Applied: ' + 'None'; 
  disableButton(deleteButton);
  disableButton(markButton);
  inputElement.style.width = '150px';
  inputElement.value = '';
  inputElement.placeholder = placeholder;
  inputElement.removeEventListener('input', handleInput);
  submitButton.removeEventListener('click', submitIntervals);
  deleteButton.removeEventListener('click', handleDelete);
  
  inputElement.addEventListener('input', handleInput);
  submitButton.addEventListener('click', submitIntervals); 
  deleteButton.addEventListener('click', handleDelete);

  const curVideoId = urlToVideoId(pageUrl);
  chrome.runtime.sendMessage({ type: 'getall' }, function (response) {
    const filteredBookObjects = response.filter(bookObject => {
      return bookObject.videoId === curVideoId;
    });
    filteredBookObjects.sort((a, b) => b.timestamp - a.timestamp);
    if (filteredBookObjects.length > 0) {
      latestMss = filteredBookObjects[0].mss;
      console.log("bookmark found " + curVideoId + ": " + latestMss);
      inputElement.value = latestMss;
      submitIntervals();
    }
  });
  hrefTrack();
}

function hrefTrack(){
  var newhref = window.location.href;
  if(pageUrl === newhref)
    setTimeout(hrefTrack,300);
  else{
    console.log("href: ", newhref);
    pageUrl = newhref;
    handleNewUrl();
  }
}

function formatTime(seconds) {
    function pad(number) {
      return number < 10 ? `0${number}` : number;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${pad(secs)}`;
}
function disableButton(button){
  button.disabled=true;
  button.style.backgroundColor = 'LightGrey';
  button.style.cursor = 'default'
}
function enableButton(button){
  button.disabled=false;
  button.style.backgroundColor = 'Grey';
  button.style.cursor = 'pointer'
}
function createIntervalInput() {
  const video = document.querySelector('video');
  const belowDiv = document.getElementById('below');

  if (belowDiv) {
    const tDiv = document.createElement("div");
    tDiv.style.display = 'inline';
    const tCopy = document.createElement("button");
    tCopy.id = tCopyId;
    tCopy.title = 'Copy this timestamp';
    const subTDiv = document.createElement("div");
    subTDiv.innerText = 'A';
    subTDiv.style.zIndex = '9999';
    subTDiv.id = subTDivId;
    tCopy.appendChild(subTDiv);
    tDiv.appendChild(tCopy);

    const inputElement = document.createElement('input');
    inputElement.id = inputElementId;

    const submitButton = document.createElement('button');
    submitButton.id= submitButtonId;
    submitButton.style.border = 'none';
    submitButton.innerText = 'Apply';
    enableButton(submitButton);

    const shineDiv = document.createElement("div");
    shineDiv.style.display = 'inline-block';
    shineDiv.style.width = '200px';
    shineDiv.style.verticalAlign= 'middle';
    const shiner = document.createElement('div');
    shiner.id = shinerId;
    shiner.innerText = '';
    shiner.style.fontSize = '1.2em';
    shiner.style.opacity = '0';
    shiner.style.marginRight = '10px';
    shineDiv.appendChild(shiner);
    shineDiv.style.overflow = 'hidden';

    const deleteButton = document.createElement('button');
    deleteButton.id = deleteButtonId;
    deleteButton.style.marginRight = '10px';
    deleteButton.title = 'Discard the applied interval';

    const markButton = document.createElement('button');
    markButton.id = bookmarkId;
    disableButton(markButton);
    markButton.innerText = '☆';
    markButton.style.border = 'none';
    markButton.style.background = 'none'; 
    markButton.title = 'Save the interval list (that you\'ve just Applied), so that it loads automatically next time.';
    markButton.style.marginRight = '10px';

    const historyButton = document.createElement('button');
    historyButton.innerText = '★';
    historyButton.id = historyId;
    historyButton.style.border = "none";
    historyButton.style.background = "none";
    historyButton.title = 'See previously bookmarked intervals';
    historyButton.style.marginRight = '20px';

    const loopLabel = document.createElement('label');
    loopLabel.setAttribute('for', loopId);
    loopLabel.innerText = ' Loop';
    const loopCheckbox = document.createElement('input');
    loopCheckbox.type = 'checkbox';
    loopCheckbox.id = loopId;
    loopCheckbox.style.marginRight = '10px';

    belowDiv.parentNode.insertBefore(tDiv, belowDiv);
    belowDiv.parentNode.insertBefore(inputElement, belowDiv);
    belowDiv.parentNode.insertBefore(submitButton, belowDiv);
    belowDiv.parentNode.insertBefore(shineDiv, belowDiv);
    belowDiv.parentNode.insertBefore(deleteButton, belowDiv);
    belowDiv.parentNode.insertBefore(markButton, belowDiv);
    belowDiv.parentNode.insertBefore(historyButton, belowDiv);
    belowDiv.parentNode.insertBefore(loopLabel, belowDiv);
    belowDiv.parentNode.insertBefore(loopCheckbox, belowDiv);

    addStaticListeners();
    adStateTrack();
    hrefTrack();
  }
}

function configureButton(text, elementId, childId, tooltipMessage, disableOnClick, onClickHandler) {
  const button = document.getElementById(elementId);
  const textHolder = childId ? document.getElementById(childId) : button;
  textHolder.innerText = text;
  Object.assign(button.style, {
    backgroundColor: 'Grey',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    position: 'relative', 
  });
  const tooltip = document.createElement('div');
  tooltip.textContent = tooltipMessage;
  tooltip.style.position = 'absolute';
  tooltip.style.top = '-110%';
  tooltip.style.left = '60%';
  tooltip.style.transform = 'translateX(-50%)'; 
  tooltip.style.backgroundColor = 'blue';
  tooltip.style.fontSize = '0.9em';
  function showTooltip() {
    button.appendChild(tooltip);
    setTimeout(removeTooltip,1000);
  }
  function removeTooltip() {
    tooltip.remove();
  }
  button.addEventListener('click', function () {
    if (!button.disabled) {
      showTooltip();
      if(disableOnClick){
        disableButton(button);
        button.style.backgroundColor = 'LightGrey'; 
      }
      if (onClickHandler)
        onClickHandler();
    }
  });
  return button;
}

function addStaticListeners(){
  const video = document.querySelector('video');
  const tCopy = document.getElementById(tCopyId);
  const subTDiv = document.getElementById(subTDivId);
  video.addEventListener("timeupdate", function () {
    const textToCopy = formatTime(video.currentTime);
    subTDiv.innerText= textToCopy;
  });
  configureButton('0:00', tCopyId, subTDivId, 'Copied', false, function () {
    const textToCopy = formatTime(video.currentTime);
    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            //console.log("Current time copied to clipboard: " + textToCopy);
        })
        .catch(err => {
            console.error("Unable to copy text: ", err);
        });
  });
  configureButton('Apply', submitButtonId, submitButtonId, 'Applied', false, null);
  configureButton('Un-apply', deleteButtonId, deleteButtonId, 'Un_applied', false, null);
  configureButton('Bookmark!', bookmarkId, bookmarkId, null, false, function (){
    const markName = prompt("To bookmark this interval list, Enter a name.");
    if(markName) if (markName.length > 0) {
      chrome.runtime.sendMessage({
        type: 'save',
        url: pageUrl,
        name: markName,
        intls: intervals
      });
    }
  });
  configureButton('All B.s', historyId, historyId, null, true, function () {
    createPopup(pageUrl,enableButton);
  });
}

function waitForLoading() {
  const video = document.querySelector('video');
  const belowDiv = document.getElementById('below');
  if(video && belowDiv){
    console.log("creating input element..");
    createIntervalInput();
  }else{
    setTimeout(waitForLoading,300);
  }
}

waitForLoading();

