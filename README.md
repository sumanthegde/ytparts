# YouTube Parts Looper & Bookmarker
[Chrome](https://chrome.google.com/webstore/detail/youtube-parts-looper-book/ofgegdifcefmhkfninkfgcjkminmbfdj) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/youtube-parts-looper/) extension to play, loop & bookmark multiple segments of a YouTube video.

## Motivation
Most existing extensions only looped a single continuous segment. We wanted to cycle through multiple disjoint segments, and to *remember* them across sessions. 

As a side effect, this also restores a feature YouTube [added](https://blog.youtube/news-and-events/cut-to-chase-with-improved-youtube/) in 2012 and [removed](https://stackoverflow.com/questions/41046667/playing-several-custom-youtube-video-urls-with-start-and-end-time-in-sequence-li#comment78182423_41046667) in 2014 — segment-aware playlists — by letting users save interval lists that reload automatically when revisiting a video.

## How it works
1. **Segment skipping** – the player is polled every 100 ms to check if the segment end was crossed, then it jumps to the next start.
2. **Persistence via bookmarks** – the extension encodes segment info in the bookmark name:
```
<unix-timestamp>#<segment-list>#<user-given-name>
```
A **segment list** is a comma-separated list of `<start-time>-<end-time>` pairs, e.g. `00:10-00:30,01:05-01:15`

- All such bookmarks are stored in a dedicated folder `YouTubePartsBookmarks`.
- On video load, the extension looks up this folder, parses the latest entry (i.e. segment list), and applies the stored segments.
- The unix-timestamp enables multiple segment lists per video and helps identify the newest one.

## Implementation challenges
1. **YouTube as an SPA** – detecting navigation events and reliably applying segment lists requires workarounds.
2. **Late attribute updates** – video metadata (including URL) is sometimes updated after playback starts, causing a lag before segments can be enforced.

## Permissions & privacy
- Requires **bookmarks access** — only within the `YouTubePartsBookmarks` folder.
- No data leaves your browser: the extension does not collect or transmit bookmarks, usage, or analytics.

---

If you’re curious about the code:
- The core logic for skipping and restoring segments lives in `root/ytparts_content.js`.
- Bookmark parsing and persistence logic is in `root/background.js`.
- Bookmark list display is handled in `root/popup.js`.

Contributions are welcome!
