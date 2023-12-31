
const dirName = 'YoutubePartsBookmarks';
let folderId;

function createFolder() {
  chrome.bookmarks.search({ 'title': dirName }, function (folders) {
    if (!folders || folders.length === 0) {
      chrome.bookmarks.create(
        {'title': dirName},
        function (dir) {
          console.log("Added folder: " + dir.title);
          folderId = dir.id; // Store the folder ID in a global variable
        }
      );
    } else {
      folderId = folders[0].id; // Folder already exists, so store its ID
      console.log(dirName + " folder already exists");
    }
  });
}

function msfy(ints) {
  if (!Array.isArray(ints)) {
    return '';
  }

  const formattedIntervals = ints.map(interval => {
    if (Array.isArray(interval) && interval.length === 2) {
      const [start, end] = interval;
      const startMinutes = Math.floor(start / 60);
      const startSeconds = start % 60;
      const endMinutes = Math.floor(end / 60);
      const endSeconds = end % 60;

      const formattedStart = `${startMinutes}:${startSeconds}`;
      const formattedEnd = `${endMinutes}:${endSeconds}`;

      return `${formattedStart}-${formattedEnd}`;
    }
  });
  return formattedIntervals.join(',');
}

function pack(dto){
  const n = 100000;
  //const rand = Math.floor(Math.random() * n) + n;
  var start = (dto.intls)[0][0];
  var urlObj = new URL(dto.url);
  urlObj.searchParams.set('t', start);
  var videoId = urlObj.searchParams.get('v');
  var newurl = urlObj.toString();
  var mss = msfy(dto.intls);
  var timestamp = Date.now();
  var newname = videoId + '#' + timestamp + '#' + mss + '#' + dto.name;
  return ({parentId: folderId, title: newname, url: newurl}); 
}

function expand(entity){
  const chunks = entity.title.split('#');
  const chunk0 = chunks.shift();
  const chunk1 = chunks.shift();
  const chunk2 = chunks.shift();
  const origname = chunks.join('#');
  var urlObj = new URL(entity.url);
  const randt = urlObj.searchParams.get('t');
  const videoId = urlObj.searchParams.get('v');
  return ({name: origname, url: entity.url, mss: chunk2, videoId: chunk0, timestamp: chunk1, packed:entity.title, systemId: entity.id});
} 


function saveBookmark(request, onExists) {
  if (folderId) {
    chrome.bookmarks.create(pack(request));
  } else {
    console.error("Error: Folder ID is not available.");
  }
}

function deleteBookmark(bigdto, sendResponse){
  if (folderId) {
    console.log("about to 'bookmarks.get': ", bigdto);
    chrome.bookmarks.get(bigdto.systemId, function(bookmarks){
      if(bookmarks.length>0){
        var bookmark = bookmarks[0];
        var newtitle = bigdto.videoId + '#' + Date.now() + '#' + bigdto.mss + '#' + bigdto.name;
        bookmark.title = newtitle;
        chrome.bookmarks.remove(bookmark.id, function() {
          console.log("Bookmark deleted: ", bigdto);
          sendResponse(0);
        });
      }else{
        console.error("Bookmark not found");
        sendResponse(-1);
      }
    });
  } else {
    console.error("Error: Folder ID is not available.");
    sendResponse(-2);
  }
}

function getAllBookmarks(sendResponse) {
  if (folderId) {
    chrome.bookmarks.getSubTree(folderId, function(results) {
      const bookmarks = results[0].children.filter(node => node.url);
      const expanded = bookmarks.map(expand);
      sendResponse(expanded);
    });
  } else {
    console.error("Error: Folder ID is not available.");
    sendResponse([]);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == 'save')
    saveBookmark(request, null);
  else if (request.type == 'delete')
    deleteBookmark(request.payload, sendResponse);
  else if (request.type == 'getall') {
    getAllBookmarks(sendResponse);
  }
  return true;
});

createFolder();

