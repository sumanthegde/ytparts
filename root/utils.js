var locationHref = undefined;
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
      const startSeconds = String(start % 60).padStart(2,'0');
      const endMinutes = Math.floor(end / 60);
      const endSeconds = String(end % 60).padStart(2,'0');

      const formattedStart = `${startMinutes}:${startSeconds}`;
      const formattedEnd = `${endMinutes}:${endSeconds}`;

      return `${formattedStart}-${formattedEnd}`;
    }
  });
  let ans = formattedIntervals.join(',');
  return ans;
}
