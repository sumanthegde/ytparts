var locationHref = undefined;

var fversion = 2;
const features = [
  {
    maxtgap: 1, // Preventive stop before end
    truncSec: Math.floor, // for copying from Start & End buttons
    addPlayerListeners: function(video){
      video.addEventListener("seeked", seekedHandler);
      video.addEventListener("timeupdate", timeupdateHandler);
    },
    toSeconds: parseTime, // function(timeStr){return parseTime(timeStr);}, // for validating on Apply, and invoking
    decimals: 0, // for shiner
    minGap: 1,  // for interval merging
    prolongEnd: function(x,_dotted) {return x;}, // from bookmarks to input box
    //    truncDecimals: function(str) {return str.replace(/\.\d+/g, "");}, // from bookmarks to input box
    exampleText: 'e.g. 0:30-0:45, 1:15-1:30',
    vectorCheck: function(x,y){return x<=y;},
    vectorSign: '≤'
  },
  {
    maxtgap: 0.5,
    truncSec: function(x){return Math.trunc(x*10)/10;},
    addPlayerListeners: function(video){
      // Remove timeupdate event listener
      // video.addEventListener("timeupdate", timeupdateHandler2);

      // Call timeupdateHandler2 every 100 ms, but stop if video is orphaned
      if (!video._ytpartsInterval) {
        video._ytpartsInterval = setInterval(() => {
          // Check if video is still in the DOM
          if (!document.body.contains(video)) {
            clearInterval(video._ytpartsInterval);
            video._ytpartsInterval = null;
            return;
          }
          timeupdateHandler2();
        }, 100);
      }
    },
    toSeconds: parseTime2, // function(timeStr,i){return parseTime2(timeStr,i===1);}, 
    decimals: 1, 
    minGap: 0.2, // In view of 0.25s gap between timeupdate events
    prolongEnd: function([l,r],dotted) {return [l,!dotted && Math.abs(r - Math.round(r)) < 0.001 ? r+0.9 : r];},
    exampleText: 'e.g. 0 - 60, 2:0.0 - 2:0.9',
    vectorCheck: function(x,y){return x<y;},
    vectorSign: '<'
  },
  {
    maxtgap: 0.5,
    truncSec: function(x){return Math.trunc(x*10)/10;},
    addPlayerListeners: function(video){
      video.addEventListener("timeupdate", timeupdateHandler2);
    },
    toSeconds: parseTime2, // function(timeStr,i){return parseTime2(timeStr,i===1);}, 
    decimals: 1, 
    minGap: 0.2, 
    prolongEnd: function([l,r],dotted) {return [l,!dotted && Math.abs(r - Math.round(r)) < 0.001 ? r+0.9 : r];},
    exampleText: 'e.g. 0 - 60, 2:0.0 - 2:0.9',
    vectorCheck: function(x,y){return x<y;},
    vectorSign: '<'
  }

]

function getUrl(){
  return locationHref;
}
function onPopState(){
  var newUrl = window.location.href;
  console.log("onPopState.");
  console.log("old:", locationHref);
  console.log("new:", newUrl);
  locationHref = newUrl;
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

function parseTime2(timeString) {
  const timeParts = timeString.split(':').reverse();
//  let prolongation = isEnd && !timeParts[0].includes('.') ? 0.9 : 0; // change 0.9 to 1.0?
  let seconds = (parseFloat(timeParts[0] || 0)).toFixed(1);
  let minutes = parseInt(timeParts[1] || 0, 10);
  let hours = parseInt(timeParts[2] || 0, 10);

  // Calculate total time in seconds
  return hours * 3600 + minutes * 60 + parseFloat(seconds);
}

function mergeAndSortIntervals(intervals) {
  if (intervals.length <= 1) 
    return intervals;
  intervals.sort((a, b) => a[0] - b[0]);
  const mergedIntls = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const curIntl = intervals[i];
    const lastMergedIntl = mergedIntls[mergedIntls.length - 1];
    if (curIntl[0] <= lastMergedIntl[1]+features[fversion].minGap) {
      lastMergedIntl[1] = Math.max(lastMergedIntl[1], curIntl[1]);
    } else {
      mergedIntls.push(curIntl);
    }
  }
  return mergedIntls;
}

function urlToVideoId(mainUrl){
  const urlObj = new URL(mainUrl);
  const urlSearchParams = new URLSearchParams(urlObj.search);
  const curVideoId = urlSearchParams.get('v');
  return curVideoId;
}

// duplicate from background.js
function msfy(ints) {
  if (!Array.isArray(ints)) {
    return '';
  }

  const formattedIntervals = ints.map(interval => {
    if (Array.isArray(interval) && interval.length === 2) {
      const [start, end] = interval;
      const startMinutes = Math.floor(start / 60);
      const startSeconds = String((start % 60).toFixed(features[fversion].decimals)).padStart(2, '0');
      const endMinutes = Math.floor(end / 60);
      const endSeconds = String((end % 60).toFixed(features[fversion].decimals)).padStart(2, '0');

      const formattedStart = `${startMinutes}:${startSeconds}`;
      const formattedEnd = `${endMinutes}:${endSeconds}`;

      return `${formattedStart}-${formattedEnd}`;
    }
  });
  let ans = formattedIntervals.join(',');
  return ans;
}
