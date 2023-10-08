# subtitle-renamer

Live at [https://subtitle-renamer.netlify.app/](https://subtitle-renamer.netlify.app/)

## Ideas

- Two strategies
  - Episode number in filenames
    - Anitony
  - File order
    - Backup if episode number is not found on either videos or subtitles
- Map subtitles to videos
- Gotchas (backburner)
  - Dragging folders
    - Only affect top level folder
    - Would need to be natural sorted
      - https://www.npmjs.com/package/natural-compare
    - Chromium only returns max 100 entries
      - https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
  - Subtitles are not in sync
    - Add way to batch offset subtitles

## Plan

- [ ] Initialize Anitony
- [x] Drag episodes
  - Move each to episode context object
    - Key is entry.name
    - Push empty array to entry.name
    - Push context to [entry.name][file]
    - Start anitony processing and push result to [entry.name][info]
  - Update table
- [x] Drag subtitles
  - If match these file extensions
    - "srt", "ass", "idx", "sub", "rt", "ssa", "mks", "vtt", "sup", "scc", "smi", "lrc", "pgs", "txt", "utf", "utf8", "utf-8"
  - Move each to subtitle content object
    - Key is entry.name
    - Push empty array to entry.name
    - Push context to [entry.name][file]
    - Push data to [entry.name][data]
    - Start anitony processing and push result to [entry.name][info]
  - Update table
- Download
  - [x] Episode Number method
    - [x] Check if each episode and subtile info if episode_number exists
      - Create episodesNumberMap and subtitlesNumberMap, key is episode_number, value is entry.name
    - [x] Check if there is one episode episode_number to one subtitle episode_number
      - Use Number() to compare
      - Create episodesSubtitlesMap, key is episode entry.name, value is subtitle entry.name
    - If anything fails, fallback to file order method
  - [x] File Order method
    - Create episodesSubtitlesMap, key is episode entry.name, value is subtitle entry.name
      - 1st episode entry.name to 1st subtitle entry.name, etc.
      - If there are more subtitles than episodes, ignore the rest
      - If there are more episodes than subtitles, ignore the rest
  - Create zip folder with JSZip
    - https://stuk.github.io/jszip/
  - For each episode in episodesSubtitlesMap
    - Add file with key name + extension with subtitle data to zip folder
  - Generate zip folder
  - Save zip folder
    - https://github.com/eligrey/FileSaver.js/