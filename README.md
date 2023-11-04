# YouTube Parts Looper & Bookmarker
[Chrome](https://chrome.google.com/webstore/detail/youtube-parts-looper-book/ofgegdifcefmhkfninkfgcjkminmbfdj)/[Firefox](https://addons.mozilla.org/en-US/firefox/addon/youtube-parts-looper/) extension to play, loop & bookmark multiple portions of a YouTube video.

#### Sample Use Case
Suppose a YouTube video is an album of 5 songs and you only want to listen to the 1st and the 3rd songs in it. Using this extension, you can specify the intervals (ranges) of those songs, and only those portions will be played.

### Features
#### Specifying Multiple Intervals
An input box appears just below the video. There, you should specify the intervals as a comma separated list. Example: "00:00-00:30, 5:00-5:30" (without quotes) specifies two intervals, namely, the first 30 seconds and then the 30 seconds after the 5-minute mark. On clicking 'Apply', these intervals are played one after another. 
- Timestamps can be in the hh:mm:ss format (e.g. "00:00:00-1:00:00" means the first 1 hour), or the mm:ss format, or just in seconds ("0-3600" also means the first 1 hour).
- A button showing the current timestamp is provided. Clicking it copies the timestamp to the clipboard. This is helpful in noting down and entering timestamps.
- Intervals are ordered by their starting time. Overlapping intervals are merged.


#### Bookmarking
You can also 'bookmark' the intervals that you have just applied (by clicking the 'Bookmark!' button). Next time you play the same video, those intervals are automatically loaded from bookmarks and only the corresponding portions are played. 
- You can use this feature to essentially create a whole playlist of video segments (by first creating the playlist on YouTube, and then bookmarking the desired portions for individual videos in it).

Clicking the button 'All B.s' opens up a side pane where all the previously bookmarked interval lists are shown. If there are multiple lists for the same video, then the most recently added interval-list will load automatically. Here, you can also manually delete a bookmark.

#### Looping
Finally, there's an option to play the sequence of portions on a loop.

### Disclosure
- This extension requires a 'bookmark access' permission. 
  - The 'bookmarking' feature works by creating entries in a dedicated bookmarks folder called 'YoutubePartsLooper' (created initially by the extension itself). Ensure not to delete or modify it.
  - Nothing outside the said bookmak folder is ever accessed.
- This extension does NOT collect or send over network any information, like the saved bookmarks or usage statistics.
