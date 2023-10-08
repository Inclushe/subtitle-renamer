var JSZip = require("jszip");
var FileSaver = require('file-saver');
var episodes = {};
var subtitles = {};
const episodesDropZoneElement = document.querySelector("#episodesDropZone");
const subtitlesDropZoneElement = document.querySelector("#subtitlesDropZone");
const subtitlesDownloadButtonElement = document.querySelector("#subtitlesDownloadButton");
const tableBodyElement = document.querySelector("#tableBody");
const autoRadioButtonElement = document.querySelector("#auto");


initializeAnitomy();
episodesDropZoneElement.addEventListener("drop", handleEpisodesDropZoneDrop);
episodesDropZoneElement.addEventListener("dragover", dragOverHandler);
episodesDropZoneElement.addEventListener("dragleave", dragLeaveHandler);
subtitlesDropZoneElement.addEventListener("drop", handleSubtitlesDropZoneDrop);
subtitlesDropZoneElement.addEventListener("dragover", dragOverHandler);
episodesDropZoneElement.addEventListener("dragleave", dragLeaveHandler);
subtitlesDownloadButtonElement.addEventListener("click", downloadSubtitles);

function initializeAnitomy() {
  window.anitomyscript('init').then((res) => console.log(res));
}

function handleEpisodesDropZoneDrop(event) {
  event.preventDefault();
  event.target.closest('.drop-zone').classList.remove("drop-zone--over");
  episodes = {};
  for (var i = 0; i < event.dataTransfer.items.length; i++) {
    let entry = event.dataTransfer.items[i].webkitGetAsEntry();
    if (entry.isFile) {
      episodes[entry.name] = {};
      episodes[entry.name]['file'] = event.dataTransfer.files[i];
      window.anitomyscript(entry.name)
        .then((res) => {
          episodes[entry.name]['info'] = res;
          updateTable();
        })
        .catch((err) => console.log(err));
    } else if (entry.isDirectory) {
      alert('Please drop files, not folders.');
    }
  }
  updateTable();
}

function handleSubtitlesDropZoneDrop(event) {
  event.target.closest('.drop-zone').classList.remove("drop-zone--over");
  event.preventDefault();
  subtitles = {};
  for (var i = 0; i < event.dataTransfer.items.length; i++) {
    let entry = event.dataTransfer.items[i].webkitGetAsEntry();
    if (entry.isFile) {
      subtitles[entry.name] = {};
      subtitles[entry.name]['file'] = event.dataTransfer.files[i];
      let reader = new FileReader();
      reader.onload = function (event) {
        subtitles[entry.name]['data'] = event.target.result;
        updateTable();
      };
      reader.readAsDataURL(event.dataTransfer.files[i]);
      window.anitomyscript(entry.name)
        .then((res) => {
          subtitles[entry.name]['info'] = res;
          updateTable();
        })
        .catch((err) => console.log(err));
    } else if (entry.isDirectory) {
      alert('Please drop files, not folders.');
    }
  }
  updateTable();
}

function downloadSubtitles(event) {
  event.preventDefault();
  let episodesSubtitlesMap = null
  if (autoRadioButtonElement.checked) {
    episodesSubtitlesMap = mapEpisodesToSubtitlesUsingEpisodeNumber();
  }
  // if not defined
  if (episodesSubtitlesMap) {
    console.log('Using episode number');
  } else {
    episodesSubtitlesMap = mapEpisodesToSubtitlesUsingFileOrder();
    console.log('Using file order');
  }
  let zipFolder = new JSZip();
  let folderName = episodes[Object.keys(episodes)[0]]['info']['anime_title'];
  if (!folderName) {
    folderName = 'subtitles';
  }
  for (let episodeName in episodesSubtitlesMap) {
    let subtitleName = episodesSubtitlesMap[episodeName];
    let newSubtitleFileName = episodes[episodeName]['info']['file_name'] + '.' + subtitles[subtitleName]['info']['file_extension'];
    zipFolder.file(newSubtitleFileName, subtitles[subtitleName]['data'].split('base64,')[1], {base64: true});
  }
  zipFolder.generateAsync({type:"blob"})
    .then(function(content) {
        FileSaver.saveAs(content, folderName + ".zip");
    });
}

function mapEpisodesToSubtitlesUsingEpisodeNumber() {
  var episodesNumberMap = {};
  var subtitlesNumberMap = {};
  var episodesSubtitlesMap = {};

  // Check episode number exists for each episode
  for (let episode in episodes) {
    if (episodes[episode]['info'] && episodes[episode]['info']['episode_number'] && !episodesNumberMap[episodes[episode]['info']['episode_number']]) {
      episodesNumberMap[episodes[episode]['info']['episode_number']] = episode;
    } else {
      return;
    }
  }

  // Check episode number exists for each subtitle
  for (let subtitle in subtitles) {
    if (subtitles[subtitle]['info'] && subtitles[subtitle]['info']['episode_number'] && !subtitlesNumberMap[subtitles[subtitle]['info']['episode_number']]) {
      subtitlesNumberMap[subtitles[subtitle]['info']['episode_number']] = subtitle;
    } else {
      return;
    }
  }

  // Bind each episode to subtitle by episode number
  for (let episodeNumber in episodesNumberMap) {
    let numberFound = false;
    for (let subtitleNumber in subtitlesNumberMap) {
      if (episodeNumber === subtitleNumber || Number(episodeNumber) == Number(subtitleNumber)) {
        episodesSubtitlesMap[episodesNumberMap[episodeNumber]] = subtitlesNumberMap[subtitleNumber];
        numberFound = true;
      }
    }
    if (numberFound === false) {
      return;
    }
  }

  return episodesSubtitlesMap;
}

function mapEpisodesToSubtitlesUsingFileOrder() {
  var episodesSubtitlesMap = {};
  const episodesKeys = Object.keys(episodes);
  const subtitlesKeys = Object.keys(subtitles);
  for (let i = 0; i < episodesKeys.length; i++) {
    episodesSubtitlesMap[episodesKeys[i]] = subtitlesKeys[i];
  }
  return episodesSubtitlesMap;
}

function updateTable() {
  tableBodyElement.innerHTML = "";
  const episodesKeys = Object.keys(episodes);
  const subtitlesKeys = Object.keys(subtitles);
  let subtitlesLoaded = 0;
  for (let i = 0; i < Math.max(episodesKeys.length, subtitlesKeys.length); i++) {
    var row = tableBodyElement.insertRow();
    var episodeCell = row.insertCell(0);
    var epInfoCell = row.insertCell(1);
    var subtitleCell = row.insertCell(2);
    var subInfoCell = row.insertCell(3);
    var subDataCell = row.insertCell(4);
    if (episodesKeys[i]) {
      episodeCell.innerHTML = episodesKeys[i];
      if (episodes[episodesKeys[i]]['info'] && episodes[episodesKeys[i]]['info']['episode_number']) {
        epInfoCell.innerHTML = episodes[episodesKeys[i]]['info']['episode_number'];
      } else {
        epInfoCell.innerHTML = '-';
      }
    }
    if (subtitlesKeys[i]) {
      subtitleCell.innerHTML = subtitlesKeys[i];
      if (subtitles[subtitlesKeys[i]]['info'] && subtitles[subtitlesKeys[i]]['info']['episode_number']) {
        subInfoCell.innerHTML = subtitles[subtitlesKeys[i]]['info']['episode_number'];
      } else {
        subInfoCell.innerHTML = '-';
      }
      if (subtitles[subtitlesKeys[i]]['data']) {
        subDataCell.innerHTML = 'Stored';
        subtitlesLoaded++;
      } else {
        subDataCell.innerHTML = '-';
      }
    }
    tableBodyElement.appendChild(row);
  }
  if (subtitlesLoaded === subtitlesKeys.length && subtitlesKeys.length > 0 && episodesKeys.length > 0) {
    subtitlesDownloadButtonElement.disabled = false;
  }
}

function dragOverHandler(event) {
  event.preventDefault();
  event.target.closest('.drop-zone').classList.add("drop-zone--over");
}

function dragLeaveHandler(event) {
  event.preventDefault();
  event.target.closest('.drop-zone').classList.remove("drop-zone--over");
}