var pageUrl = undefined;
var intervals = undefined;
var lastStart = undefined;
var imin = undefined;
var adState = false;
var oldAdState = undefined;
var videoLoadTime = undefined;
const subTDivId = 'subTDiv7354';
const tCopyId = 'tCopy7354';
const inputElementId = 'inputElement7354';
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
  for (let i=imin; i<n; i++){
    const [open,close] = intervals[i];
    const cur = video.currentTime; //
    if(lastStart <= close && close+1 < cur){
      imin = repeat ? (i+1)%n : i+1;
      if(cur < close+2){ // interval overshoot
        video.currentTime = imin == n ? video.duration : intervals[imin][0];
        return;
      }
    }
  }
  const PREEMPT_S = 0.3; // if < 0.1, video won't replay on firefox
  if(repeat==true && video.currentTime > video.duration - PREEMPT_S){
    video.currentTime = intervals.length > 0 ? intervals[0][0] : 0;
    return;
  }
}

function seekedHandler(){
  const video = document.querySelector('video');
  if(adState){
    console.log("seeked but ad is showing. t=", video.currentTime);
    return;
  }
  let t = video.currentTime;
  const ELAPSED_S = 0.25; // Guessed lower bound on the time elapsed since the seek event
  lastStart = t-ELAPSED_S; // without this, the condition (lastStart <= close) may fail, when open==close.
  imin = 0;
}

var parAd = false;
var parAd0 = undefined;
function parallelAdTrack(){
  const player = document.getElementById('movie_player');
  if(player){
    const admod = player.getElementsByClassName('video-ads ytp-ad-module')[0];
    if(admod)
      parAd = !!admod.childElementCount;
  }
  if(parAd === parAd0){
  }else{
    parAd0=parAd;
    const video = document.querySelector('video');
    console.log("parAd:",parAd, " video: ", video.currentTime);
  }
  setTimeout(parallelAdTrack,100);
}

function adStateTrack(){
  const player = document.getElementById('movie_player');
  if(!player){
    setTimeout(adStateTrack,1000);
    return;
  } 
  const video = document.querySelector('video');
  if(video.readyState === 4)
    videoLoadTime = Date.now();
  console.log("ready? ", video.readyState, videoLoadTime);
  video.addEventListener('loadeddata', function (){
    videoLoadTime = Date.now();
    console.log("Loaded: ", video.duration, video.baseURI.slice(0,44));
  });
  console.log("player: ", !!player);
  //const admod = player.getElementsByClassName('video-ads ytp-ad-module')[0];
  //console.log("admod: ", !!admod);

  function handleResultChange(mutationsList, observer) {
    const admod = player.getElementsByClassName('video-ads ytp-ad-module')[0];
    adState = admod && (admod.childElementCount > 0); //player.getElementsByClassName('video-ads ytp-ad-module')[0].childElementCount || false;
    if (adState !== oldAdState){
      oldAdState = adState;
      const inputElement = document.getElementById(inputElementId);
      const submitButton = document.getElementById(submitButtonId);
      const deleteButton = document.getElementById(deleteButtonId);
      if(adState){
        videoLoadTime = 2e12;
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
      const video = document.querySelector('video');
      console.log("Ad: ", adState);
    }
  }
  const observer = new MutationObserver(handleResultChange);
  const config = {attributes: true, childList: true};
  observer.observe(player, config);
}


function submitIntervalsOnEnter(event){
  if (event.key === 'Enter' && event.target.value.trim() !== '')
    submitIntervals();
}

function submitIntervals() {
  const example = ' Example: "00:30 - 00:45, 1:55 - 2:05" (without quotes)';
  const pattern = /^\s*[0-9.:\s]+-[0-9.:\s]+(,\s*[0-9.:\s]+-[0-9.:\s]+)*\s*$/;
  const patternFail = 'Input format should be startTime-endTime,startTime-endTime,... etc.' + example;
  const timestampFail = 'Ensure startTime ≤ endTime, and that timestamps are in h:m:s or m:s or s format.' + example;
  const intervalsStr = document.getElementById(inputElementId).value;
  if (intervalsStr.trim()===''){
    intervals=[];
    invokePending = true;
    //invokeIntervals(60);
    return;
  }
  if (intervalsStr.length>200){
    alert("Input too long.");
    return;
  }
  if (!pattern.test(intervalsStr)){
    alert(patternFail);
    return;
  }
  const intervalsRaw = intervalsStr.split(',').map(intervalStr => intervalStr.split('-').map(timeStr => parseTime(timeStr)));
  if(intervalsRaw.some(interval => isNaN(interval[0]) || isNaN(interval[1]) || interval[0] > interval[1])){
    alert(timestampFail);
    return;
  }
  const video = document.querySelector('video');
  const videoLen = video.duration;
  const maxt = Math.trunc(videoLen)-1;
  const intervalsCapped = intervalsRaw.map(([start,end]) => [start>maxt ? maxt:start, end>maxt ? maxt:end]);
  intervals = mergeAndSortIntervals(intervalsCapped);
  invokePending = true;
  invokeIntervals(5);
}

function invokeIntervals(k){
  const video = document.querySelector('video');
  const t = video.currentTime;
  if(!adState && video.readyState === 4 && (Date.now()-videoLoadTime>100)){
    imin = 0;
    if(intervals.length>0){
      const t1 = intervals.length > 0 ? intervals[0][0] : 0;
      video.currentTime = t1;
      console.log('invoked. t was ' + t + ', now ' + t1 + ' dur: ' + video.duration);
    }
    showAndFadeShiner();
  }else if(k>0){
    if(Number.isInteger(k)){
      console.log("trial ", k);
      k-=0.1;
    }
    setTimeout(invokeIntervals, 100, k-(adState ? 0 : 0.1));
  }
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
  const FADE_MS = 2000;
  setTimeout(function () {
    shiner.style.opacity = '0.5';
  }, FADE_MS);
}

function handleNewUrl() {
  intervals = []; 
  lastStart = -1;
  imin = 0;
  videoLoadTime = 2e12;
  const placeholder = 'e.g. 0:30-0:45, 1:15-1:30';
  const inputElement = document.getElementById(inputElementId);
  const submitButton = document.getElementById(submitButtonId);
  const deleteButton = document.getElementById(deleteButtonId);
  const markButton = document.getElementById(bookmarkId);
  const shiner = document.getElementById(shinerId);
 
  function handleInput(event) {
    disableButton(markButton);
    if(event.target.value.trim()===''){
      disableButton(submitButton);
    }else
      enableButton(submitButton);
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
  const POLL_MS = 300;
  var newhref = window.location.href;
  if(pageUrl === newhref)
    setTimeout(hrefTrack, POLL_MS);
  else{
    console.log("href: ", newhref.slice(0,44));
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
    subTDiv.id = subTDivId;
    subTDiv.style.fontFamily = "Courier New, monospace";
    tCopy.appendChild(subTDiv);
    tDiv.appendChild(tCopy);

    const inputElement = document.createElement('input');
    inputElement.id = inputElementId;

    const submitButton = document.createElement('button');
    submitButton.id= submitButtonId;
    submitButton.style.border = 'none';
    //submitButton.innerText = 'Apply';
    //enableButton(submitButton);

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
    //markButton.innerText = '☆';
    //markButton.style.border = 'none';
    //markButton.style.background = 'none'; 
    markButton.title = 'Save the interval list (that you\'ve just Applied), so that it loads automatically next time.';
    markButton.style.marginRight = '10px';

    const historyButton = document.createElement('button');
    historyButton.id = historyId;
    //historyButton.innerText = '★';
    //historyButton.style.border = "none";
    //historyButton.style.background = "none";
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
    //parallelAdTrack();
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
  const TOOLTIP_MS = 1000;
  function showTooltip() {
    button.appendChild(tooltip);
    setTimeout(removeTooltip, TOOLTIP_MS);
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
  video.addEventListener("seeked", seekedHandler);
  video.addEventListener("timeupdate", timeupdateHandler);
  const tCopy = document.getElementById(tCopyId);
  const subTDiv = document.getElementById(subTDivId);
  video.addEventListener("timeupdate", function () {
    const textToCopy = formatTime(video.currentTime);
    subTDiv.innerText= textToCopy;
  });
  configureButton('0:00', tCopyId, subTDivId, 'Copied', false, function () {
    const textToCopy = formatTime(video.currentTime);
    navigator.clipboard.writeText(textToCopy)
        .then(() => {})
        .catch(err => {
            console.error("Unable to copy text: ", err);
        });
  });
  configureButton('Apply', submitButtonId, submitButtonId, 'Applied', false, null);
  configureButton('Un-apply', deleteButtonId, deleteButtonId, 'Un_applied', false, null);
  configureButton('Bookmark!', bookmarkId, bookmarkId, null, false, function (){
    const markName = prompt("To bookmark this interval list, Enter a name.");
    if(markName){
      if(markName.length === 0)
        alert("ERROR: Name cannot be empty");
      else if (markName.indexOf('#') > -1)
        alert("ERROR: Name cannot contain special characters like '#'");
      else{
        chrome.runtime.sendMessage({
          type: 'save',
          url: pageUrl,
          name: markName,
          intls: intervals
        });
      }
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
    console.log("Version " + chrome.runtime.getManifest().version);
    createIntervalInput();
  }else{
    const POLL_MS = 300;
    setTimeout(waitForLoading, POLL_MS);
  }
}

waitForLoading();

function old_adStateTrack() {
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
            const video = document.querySelector('video');
            console.log("ad: ", adState, " video: ", video.currentTime);
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
function invokeIntervalsDiverged(){
  console.log("invokeIntervals.",trial);
  const POLL_S = 0.1;
  const POLL_MS = POLL_S*1000;
  const video = document.querySelector('video');
  const videoUrl = video.baseURI;
  const videoLen = video.duration;
  const t = video.currentTime;
  if(urlToVideoId(videoUrl) === urlToVideoId(pageUrl)){
    imin = 0;
    if(intervals.length>0){
      const t1 = intervals.length > 0 ? intervals[0][0] : 0;
      if(videoUrl===video.baseURI){
        video.currentTime = t1;
        done=true;
        console.log('invoked. t was ' + t + ', now ' + t1 + ' vid: ' + videoUrl);
      }else
        console.log('Error: Video URL changed');
    }else
      done=true;
  }
  if(done)
    showAndFadeShiner();
  else if(trial>0)
    setTimeout(invokeIntervals, trial-POLL_S);
  else
    console.log("Aborting normalize. ", myST);
}

