var intervals = []; 
var lastStart = undefined;
var imin = undefined;

function timeupdateHandler(){
  const video = document.querySelector('video');
  let n = intervals.length;
  for (let i=imin; i<n; i++){
    const [open,close] = intervals[i];
    const cur = video.currentTime; //
    // On just exceeding an interval, skip to the next interval
    if(lastStart <= close && close+1 < cur){
      let repeat = document.getElementById('loopCheckbox').checked;
      imin = repeat ? (i+1)%n : i+1;
      video.currentTime = imin == n ? video.duration : intervals[imin][0];
      //console.log(lastStart + " " + close + " " + cur + "   " + intervals[imin]);
      break;
    }
  }
}

function seekedHandler(){
  const video = document.querySelector('video');
  let t = video.currentTime;
  lastStart = t-0.25; // without -0.25, the condition (lastStart <= close) may fail, when open==close.
  imin = 0;
}

function mergeAndSortIntervals(intervals) {
  if (intervals.length <= 1) 
    return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const mergedIntls = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const curIntl = intervals[i];
    const lastMergedIntl = mergedIntls[mergedIntls.length - 1];
    if (curIntl[0] <= lastMergedIntl[1]+1) {
      lastMergedIntl[1] = Math.max(lastMergedIntl[1], curIntl[1]);
    } else {
      mergedIntls.push(curIntl);
    }
  }
  return mergedIntls;
}

function parseTime(timeString) {
  const timeParts = timeString.split(':').map(part => parseInt(part));
  const n = timeParts.length;
  if (n === 1) {
    return timeParts[0];
  } else if (n === 2) {
    return timeParts[0] * 60 + timeParts[1];
  } else if (n === 3) {
    return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
  }
  return NaN;
}

function submitIntervals() {
  const video = document.querySelector('video');
  const maxt = Math.trunc(video.duration)-1;
  const intervalsStr = document.getElementById('intervalInput').value;
  console.log("-->"+intervalsStr);
  const pattern = /^\s*[0-9:\s]+-[0-9:\s]+(,\s*[0-9:\s]+-[0-9:\s]+)*\s*$/
  if (intervalsStr.trim()==='')
    intervals = [];
  else if (intervalsStr.length>200)
    alert("Input too long.");
  else if (pattern.test(intervalsStr)){
    const intervalsRaw = intervalsStr.split(',').map(intervalStr => intervalStr.split('-').map(timeStr => parseTime(timeStr)));
    if(intervalsRaw.some(interval => isNaN(interval[0]) || isNaN(interval[1]) || interval[0] > interval[1]))
      alert("Ensure startTime ≤ endTime, and that timestamps are in h:m:s or m:s or s format.");
    else{
      const intervalsCapped = intervalsRaw.map(([start,end]) => [start>maxt ? maxt:start, end>maxt ? maxt:end]);
      intervals = mergeAndSortIntervals(intervalsCapped);
    }
  }else
      alert("Input format should be 'startTime-endTime, startTime-endTime, ...'");
  console.log("==>"+intervals);
  video.removeEventListener("seeked", seekedHandler);
  video.removeEventListener("timeupdate", timeupdateHandler);
  video.addEventListener("seeked", seekedHandler);
  video.addEventListener("timeupdate", timeupdateHandler);
  if(intervals.length>0){
    lastStart = 0;
    imin = 0;
    video.currentTime = intervals[0][0];
  }
}

function createIntervalInput() {
  const belowDiv = document.getElementById('below');

  if (belowDiv) {
    const inputElement = document.createElement('input');
    inputElement.id = 'intervalInput';
    const placeholder = 'e.g. 0:59-1:03, 1:59:00-2:00:30';
    inputElement.placeholder = placeholder;

    const submitButton = document.createElement('button');
    submitButton.innerText = 'Submit';
    submitButton.addEventListener('click', submitIntervals);

    inputElement.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') 
        submitIntervals();
    });

    const loopCheckbox = document.createElement('input');
    loopCheckbox.type = 'checkbox';
    loopCheckbox.id = 'loopCheckbox';
    const loopLabel = document.createElement('label');
    loopLabel.setAttribute('for', 'loopCheckbox');
    loopLabel.innerText = ' Loop';

    belowDiv.parentNode.insertBefore(inputElement, belowDiv);
    belowDiv.parentNode.insertBefore(submitButton, belowDiv);
    belowDiv.parentNode.insertBefore(loopLabel, belowDiv);
    belowDiv.parentNode.insertBefore(loopCheckbox, belowDiv);
   
    function adjustInputWidth() {
      const w = inputElement.scrollWidth;
      const maxW = belowDiv.clientWidth/2 - submitButton.clientWidth - loopLabel.clientWidth - 10;
      inputElement.style.width = (w > maxW ? maxW : w) + 'px';
    }

    inputElement.value = placeholder;
    adjustInputWidth();
    inputElement.value = '';
    inputElement.addEventListener('input', adjustInputWidth);
  }
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
