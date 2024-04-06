var pageUrl = 'https://youtube.com';
var intervals = [];
var lastStart = undefined;
var imin = undefined;
var adState = false;
var oldAdState = undefined;
var videoLoadTime = undefined;
var firstLoad = true;
var initDone = false;
var themeIndex = 0;
const TESTING = false;
const subFromDivId = 'subFromDiv7354';
const subToDivId= 'subToDiv7354';
const tFromId = 'tFrom7354';
const tToId= 'tTo7354';
const inputElementId = 'inputElement7354';
const submitButtonId = 'submitButton7354';
const deleteButtonId = 'deleteButton7354';
const loopId = 'loopCheckbox7354';
const shinerId = 'shiner7354';
const bookmarkId = 'bookmark7354';
const historyId = 'historyButton7354';
const themeList = [['black','grey','lightgrey','white'], 
                   ['white','lightgrey','dimgrey','black']];

function timeupdateHandler(){
  if(adState) return;
  const video = document.querySelector('video');
  let repeat = document.getElementById(loopId).checked;
  let n = intervals.length;
  for (let i=imin; i<n; i++){
    const [open,close] = intervals[i];
    const cur = video.currentTime;
    if(lastStart <= close && close+1 < cur){
      imin = repeat ? (i+1)%n : i+1;
      if(cur < close+2){
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
    return;
  }
  let t = video.currentTime;
  const ELAPSED_S = 0.25; // Guessed lower bound on the time elapsed since the seek event
  lastStart = t-ELAPSED_S; // without this, the condition (lastStart <= close) may fail, when open==close.
  imin = 0;
}

function loadTrack(){
  const video = document.querySelector('video');
  video.addEventListener('loadeddata', function (){
    videoLoadTime = Date.now();
    console.log("loaded.", video.duration, pageUrl ? urlToVideoId(pageUrl): null);
    knowTheme();
    if(firstLoad)
      createIntervalInput();
    else
      handleNewUrl();
  });
  adStateTrack();
}

function adBasedButtonUpdate(){
  const inputElement = document.getElementById(inputElementId);
  const submitButton = document.getElementById(submitButtonId);
  const deleteButton = document.getElementById(deleteButtonId);
  if(adState){
    submitButton.removeEventListener('click', submitIntervalsOnClick);
    inputElement.removeEventListener('keydown', submitIntervalsOnEnter);
    disableButton(submitButton);
    disableButton(deleteButton);
  }else{
    submitButton.addEventListener('click', submitIntervalsOnClick);
    inputElement.addEventListener('keydown', submitIntervalsOnEnter);
    enableButton(submitButton);
    if(intervals.length>0)
      enableButton(deleteButton);
  }
}

function adStateTrack(){
  const video = document.querySelector('video');
  const player = document.getElementById('movie_player');
  console.log('player:', !!player, (video.parentElement ? !!video.parentElement.parentElement : 'FALSE'));
  function mutationCallback(mutationsList){
    adState = player.classList.contains("ad-showing");
    if (adState !== oldAdState) {
      oldAdState = adState;
      if(initDone)
        adBasedButtonUpdate();
      console.log("ad: ", adState, " dur: ", video.duration);
    }
  };
  var observer = new MutationObserver(mutationCallback);
  observer.observe(player, { attributes: true, attributeFilter: ['class'] });
}


function submitIntervalsOnEnter(event){
  if (event.key === 'Enter' && event.target.value.trim() !== '')
    submitIntervals();
}

function submitIntervalsOnClick(){
  submitIntervals();
}

function strToIntervals(str){
  return str.split(',').map(intervalStr => intervalStr.split('-').map(timeStr => parseTime(timeStr)))
}

function submitIntervals() {
  const intervalsStr = document.getElementById(inputElementId).value;
  if (intervalsStr.trim()===''){
    intervals=[];
    showAndFadeShiner();
    return;
  }
  const example = ' Example: "00:30 - 00:45, 1:55 - 2:05" (without quotes)';
  const pattern = /^\s*[0-9.:\s]+-[0-9.:\s]+(,\s*[0-9.:\s]+-[0-9.:\s]+)*\s*$/;
  const patternFail = 'Input format should be startTime-endTime,startTime-endTime,... etc.' + example;
  const timestampFail = 'Ensure startTime ≤ endTime, and that timestamps are in h:m:s or m:s or s format.' + example;
  if (intervalsStr.length>200){
    alert("Input too long.");
    return;
  }
  if (!pattern.test(intervalsStr)){
    alert(patternFail);
    return;
  }
  const intervalsCsv = strToIntervals(intervalsStr);
  if(intervalsCsv.some(interval => isNaN(interval[0]) || isNaN(interval[1]) || interval[0] > interval[1])){
    alert(timestampFail);
    return;
  }
  const video = document.querySelector('video');
  const videoLen = video.duration;
  const maxt = Math.trunc(videoLen)-1;
  const capped = intervalsCsv.map(([start,end]) => [start>maxt ? maxt:start, end>maxt ? maxt:end]);
  intervals = mergeAndSortIntervals(capped);
  console.log(intervals);
  invokeIntervals(20);
}

function invokeIntervals(k){
  const video = document.querySelector('video');
  const t = video.currentTime;
  if(!adState && video.readyState===4 && (Date.now()-videoLoadTime>100)){
    imin = 0;
    if(intervals.length>0){
      const t1 = intervals.length > 0 ? intervals[0][0] : 0;
      video.currentTime = t1;
      console.log('invoked.', t,  t1, video.duration);
    }
    showAndFadeShiner();
  }else if(k>0){
    setTimeout(invokeIntervals, 100, k-!adState);
    if(!adState) console.log('('+k+')');
  }else
    console.log('gave up.');
}

function showAndFadeShiner() {
  var shiner = document.getElementById(shinerId);
  var deleteButton = document.getElementById(deleteButtonId);
  var markButton = document.getElementById(bookmarkId);
  shiner.style.opacity = '1';
  shiner.style.transition = 'opacity 2s';
  shiner.style.color = themeList[themeIndex][0];
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
  const video = document.querySelector('video');
  if(video.baseURI === pageUrl)
    return;
  pageUrl = undefined; // video.baseURI may be null yet

  intervals = []; 
  lastStart = -1;
  imin = 0;

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

  function handleFocus(){
    inputElement.dir = 'auto';
    inputElement.scrollLeft = inputElement.scrollWidth;
  }

  function handleFocusout(){
    inputElement.scrollLeft = inputElement.scrollWidth;
  }


  shiner.innerText = 'Applied: ' + 'None'; 
  disableButton(deleteButton);
  disableButton(markButton);
  inputElement.style.width = '150px';
  inputElement.style.backgroundColor = themeList[themeIndex][3];
  inputElement.style.color = themeList[themeIndex][0];
  inputElement.value = '';
  inputElement.placeholder = placeholder;
  inputElement.removeEventListener('input', handleInput);
  inputElement.removeEventListener('focusout', handleFocusout);
  inputElement.removeEventListener('focus', handleFocus);

  deleteButton.removeEventListener('click', handleDelete);
  
  inputElement.addEventListener('input', handleInput);
  inputElement.addEventListener('focusout', handleFocusout);
  inputElement.addEventListener('focus', handleFocus);
  
  deleteButton.addEventListener('click', handleDelete);

  pageUrl = video.baseURI;
  console.log("https://youtu.be/" + urlToVideoId(pageUrl));
  const curVideoId = urlToVideoId(pageUrl);
  chrome.runtime.sendMessage({ type: 'getall' }, function (response) {
    const filteredBookObjects = response.filter(bookObject => {
      return bookObject.videoId === curVideoId;
    });
    filteredBookObjects.sort((a, b) => b.timestamp - a.timestamp);
    if(TESTING){
      latestMss = '0:20-0:30,0:50-0:59,30:0-32:0';
      console.log("TESTING.");
    }
    if (filteredBookObjects.length > 0) {
      latestMss = filteredBookObjects[0].mss;
      console.log(curVideoId + " # " + latestMss);
      inputElement.value = latestMss; // UI consistency sake only
      intervals = strToIntervals(latestMss);
      invokeIntervals(20);
    }
  });
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
  button.style.backgroundColor = themeList[themeIndex][2]; // 'LightGrey';
  button.style.cursor = 'default'
}
function enableButton(button){
  button.disabled=false;
  button.style.backgroundColor = themeList[themeIndex][1]; // 'Grey';
  button.style.cursor = 'pointer'
}

function knowTheme() {
    var metas = Array.from(document.head.getElementsByTagName('meta'));
    var theme = metas.find(function(meta) {
        return meta.getAttribute('name') === 'theme-color';
    });
    if(theme){
      var val = theme.getAttribute('content');
      if(val)
        if(!val.includes('255'))
          themeIndex = 1;
    }
    console.log("theme: " + themeIndex);
}

function createIntervalInput() {
  firstLoad = false;
  const belowDiv = document.getElementById('below');
  if (belowDiv) {
    const fromDiv = document.createElement("div");
    fromDiv.style.display = 'inline';
    const tFrom = document.createElement("button");
    tFrom.id = tFromId;
    tFrom.title = 'Copy current time as start time';
    const subFromDiv = document.createElement("div");
    subFromDiv.id = subFromDivId;
    //subFromDiv.style.fontFamily = "Courier New, monospace";
    tFrom.appendChild(subFromDiv);
    fromDiv.appendChild(tFrom);

    const toDiv = document.createElement("div");
    toDiv.style.display = 'inline';
    const tTo = document.createElement("button");
    tTo.id = tToId;
    tTo.title = 'Copy current time as end time';
    const subToDiv = document.createElement("div");
    subToDiv.id = subToDivId;
    //subToDiv.style.fontFamily = "Courier New, monospace";
    tTo.appendChild(subToDiv);
    toDiv.appendChild(tTo);

    const inputElement = document.createElement('input');
    inputElement.id = inputElementId;
    inputElement.style.position = 'relative';

    const submitButton = document.createElement('button');
    submitButton.id= submitButtonId;
    submitButton.style.border = 'none';

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
    markButton.title = 'Save the interval list (that you\'ve just Applied), so that it loads automatically next time.';
    markButton.style.marginRight = '10px';

    const historyButton = document.createElement('button');
    historyButton.id = historyId;
    historyButton.title = 'See previously bookmarked intervals';
    historyButton.style.marginRight = '20px';

    const loopLabel = document.createElement('label');
    loopLabel.setAttribute('for', loopId);
    loopLabel.innerText = ' Loop';
    loopLabel.style.position = 'relative';
    loopLabel.style.color = themeList[themeIndex][0];// lightTheme ? 'black' : 'white';
    
    const loopCheckbox = document.createElement('input');
    loopCheckbox.type = 'checkbox';
    loopCheckbox.id = loopId;
    loopCheckbox.style.marginRight = '10px';
    loopCheckbox.style.position = 'relative';

    belowDiv.parentNode.insertBefore(fromDiv, belowDiv);
    belowDiv.parentNode.insertBefore(toDiv, belowDiv);
    belowDiv.parentNode.insertBefore(inputElement, belowDiv);
    belowDiv.parentNode.insertBefore(submitButton, belowDiv);
    belowDiv.parentNode.insertBefore(shineDiv, belowDiv);
    belowDiv.parentNode.insertBefore(deleteButton, belowDiv);
    belowDiv.parentNode.insertBefore(markButton, belowDiv);
    belowDiv.parentNode.insertBefore(historyButton, belowDiv);
    belowDiv.parentNode.insertBefore(loopLabel, belowDiv);
    belowDiv.parentNode.insertBefore(loopCheckbox, belowDiv);

    addStaticListeners();
    adBasedButtonUpdate();
    initDone=true;
    console.log('init done.');
    handleNewUrl();
  }else{
    setTimeout(createIntervalInput,300);
  }
}

function configureButton(text, elementId, childId, disableOnClick, onClick) {
  const button = document.getElementById(elementId);
  const textHolder = childId ? document.getElementById(childId) : button;
  textHolder.innerText = text;
  Object.assign(button.style, {
    backgroundColor: themeList[themeIndex][1], // 'Grey',
    color: themeList[themeIndex][3], //'white',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    position: 'relative', 
  });
  function showTooltip(tooltipMessage) {
    const tooltip = document.createElement('div');
    tooltip.textContent = tooltipMessage;
    tooltip.style.position = 'absolute';
    tooltip.style.top = '-110%';
    tooltip.style.left = '60%';
    tooltip.style.transform = 'translateX(-50%)'; 
    tooltip.style.backgroundColor = 'blue';
    tooltip.style.fontSize = '0.9em';
    const TOOLTIP_MS = 500;
    button.appendChild(tooltip);
    function removeTooltip() {
      tooltip.remove();
    }
    setTimeout(removeTooltip, TOOLTIP_MS);
  }
  button.addEventListener('click', function () {
    if (!button.disabled) {
      if(disableOnClick){
        disableButton(button);
        button.style.backgroundColor = themeList[themeIndex][2]; // 'LightGrey'; 
      }
      var tooltipMessage = onClick();
      if(tooltipMessage)
        showTooltip(tooltipMessage);
    }
  });
  return button;
}

function writeStartTime(input, t) {
  t+=' -'
  input=input.trim()
  if (input.endsWith('-')) {
    const i = input.lastIndexOf(',') + 1;
    const trimmed = input.substring(0, i).trim();
    return i == 0 ? t : (trimmed + ' ' + t);
  } else {
    return input.length == 0 ? t : (input + ', ' + t);
  }
}

function writeEndTime(input, t) {
  input=input.trim()
  const i = input.lastIndexOf('-');
  const trimmed = input.substring(0, i).trim();
  return (trimmed.length == 0 ? '0' : trimmed) + ' - ' + t;
}

function addStaticListeners(){
  const video = document.querySelector('video');
  video.addEventListener("seeked", seekedHandler);
  video.addEventListener("timeupdate", timeupdateHandler);
  configureButton('Start', tFromId, subFromDivId, false, function () {
    const textToCopy = formatTime(video.currentTime);
    const inputElement = document.getElementById(inputElementId);
    
    inputElement.value = writeStartTime(inputElement.value, textToCopy);
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('focusout'));
    return textToCopy;
    /*
    navigator.clipboard.writeText(textToCopy)
        .then(() => {})
        .catch(err => {
            console.error("Unable to copy text: ", err);
        });
    */
  });
  configureButton('End', tToId, subToDivId, false, function () {
    const textToCopy = formatTime(video.currentTime);
    const inputElement = document.getElementById(inputElementId);
    
    inputElement.value = writeEndTime(inputElement.value, textToCopy);
    inputElement.dispatchEvent(new Event('input'));
    inputElement.dispatchEvent(new Event('focusout'));
    return textToCopy;
  });
  configureButton('Apply', submitButtonId, submitButtonId, false, () => 'Applied');
  configureButton('Un-apply', deleteButtonId, deleteButtonId, false, () => 'Un_applied');
  configureButton('Bookmark!', bookmarkId, bookmarkId, false, function (){
    const markName = prompt("To bookmark this interval list, enter a name.");
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
    return null;
  });
  configureButton('All B.s', historyId, historyId, true, function () {
    createPopup(pageUrl,enableButton);
    return null;
  });
}


function awaitVideo() {
  const video = document.querySelector('video');
  if(video)
    loadTrack();
  else{
    function handleMutations(mutationsList, observer) {
      mutationsList.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            if (mutation.addedNodes[i].tagName === 'VIDEO') {
              loadTrack();
              observer.disconnect();
              break;
            }
          }
        }
      });
    }
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

console.log("Version " + chrome.runtime.getManifest().version);
document.addEventListener('DOMContentLoaded', awaitVideo);
