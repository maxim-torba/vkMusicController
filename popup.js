let backgroundPage = chrome.extension.getBackgroundPage();
let commandBtns = document.getElementsByClassName('command');
let progressWrapper = document.getElementById('progressWrapper');
let volumeWrapper = document.getElementById('volumeWrapper');
let playlistEl = document.getElementById('playlist');
let notPlayingMessage = '<div id="noAudio">Open vk audios and start to play music</div>';
let tabId = 0;
let command = '';
let list = [];
let current = [];
let isPlaying = true;
let numberItems = 0;
let canSetProgress = false;

function getTabId() {
    chrome.tabs.query({'audible': true, 'url': 'https://vk.com/*'}, (tabs) => {
        try {
            tabId = tabs[0].id;
        } catch (err) {
            // console.error(err);
            tabId = backgroundPage.tabId;
        }

        if (tabId) {
            if (tabId != backgroundPage.tabId) {
                backgroundPage.tabId = tabId;
                backgroundPage.isExecutedContentScript = false;
            }
            if (!backgroundPage.isExecutedContentScript)
                executeContentScript();
            else
                updateInfo();
        } else {
            playlistEl.innerHTML = notPlayingMessage;
        }
    });
}

window.onload = function () {
    getTabId();
    setEventListeners();
};

function executeContentScript() {
    chrome.tabs.executeScript(tabId, {file: 'scripts/content.script.js'}, updateInfo);
}

function updateInfo() {
    chrome.tabs.sendMessage(tabId, {method: "getAudioPlayer"}, (response) => {
        try {
            list = JSON.parse(response.list);
            current = JSON.parse(response.current);
            isPlaying = JSON.parse(response.isPlaying);
            let volume = response.volume;

            if (command)
                updatePlaylistDom();
            else {
                playlistEl.appendChild(createPlaylistDOM());
                canSetProgress = true;
            }

            if (!command || command == 'next' || command == 'previous') {
                let myScroller = zenscroll.createScroller(playlistEl, 500);//1500
                myScroller.center(document.getElementsByClassName('current')[0]);
            }

            if (command == 'newProgress')
                canSetProgress = true;

            setPlayerInfo();
            setVolume(volume);
            setPlayPauseBtn(isPlaying);
        } catch (err) {
            console.error(err);
            playlistEl.innerHTML = notPlayingMessage;
        }
    });
    backgroundPage.isExecutedContentScript = true;
}

function setPlayerInfo() {
    let track_infoEl = document.getElementById('track_info');
    track_infoEl.getElementsByClassName('audioPlayer_performer')[0].innerHTML = current[4];
    track_infoEl.getElementsByClassName('audioPlayer_title')[0].innerHTML = current[3];
    track_infoEl.getElementsByClassName('audioPlayer_duration')[0].innerHTML = getFormattedDuration(current[5]);
}

function getFormattedDuration(timeInSeconds) {
    let m = Math.floor(timeInSeconds / 60);
    let s = timeInSeconds - m * 60;
    return m + ':' + (s < 10 ? '0' + s : s);
}

function setEventListeners() {
    document.getElementById('showVkPage').onclick = function () {
        //just chrome.tabs.update don't switch tabs if calling from another window
        chrome.windows.getAll({populate: true}, (windows) => {
            windows.forEach((win) => {
                win.tabs.forEach((t) => {
                    if (t.id == tabId) {
                        chrome.windows.update(win.id, {focused: true});
                        chrome.tabs.update(tabId, {active: true});
                    }
                })
            })
        });
    };

    for (let i = 0; i < commandBtns.length; i++) {
        commandBtns[i].onclick = function () {
            /*  if (!tabId) {
                  return;
              }*/
            backgroundPage.commandListener(commandBtns[i].id, tabId);
        }
    }

    progressWrapper.onmousedown = function (e) {
        let newProgress = (e.clientX - progressWrapper.offsetLeft) / progressWrapper.offsetWidth;
        canSetProgress = false;
        setProgress(newProgress);
    };

    progressWrapper.onmousemove = function (e) {
        if (e.which == 1) {
            progressWrapper.onmousedown(e);
            if (e.clientX == progressWrapper.offsetLeft ||
                (e.clientX - progressWrapper.offsetLeft) == progressWrapper.offsetWidth ||
                e.clientY == progressWrapper.offsetTop ||
                (e.clientY - progressWrapper.offsetTop) == progressWrapper.offsetHeight - 1) {
                progressWrapper.onmouseup(e);
            }
        }
    };

    progressWrapper.onmouseup = function (e) {
        /*     if (!tabId) {
                 return;
             }*/
        let newProgress = (e.clientX - progressWrapper.offsetLeft) / progressWrapper.offsetWidth;
        backgroundPage.commandListener('newProgress', tabId, {progress: newProgress});
    };


    volumeWrapper.onmousedown = function (e) {
        let newVolume = (e.clientX - volumeWrapper.offsetLeft) / volumeWrapper.offsetWidth;
        setVolume(newVolume);
    };

    volumeWrapper.onmousemove = function (e) {
        if (e.which == 1) {
            volumeWrapper.onmousedown(e);
            if (e.clientX == volumeWrapper.offsetLeft ||
                (e.clientX - volumeWrapper.offsetLeft) == volumeWrapper.offsetWidth - 1 ||
                e.clientY == volumeWrapper.offsetTop ||
                (e.clientY - volumeWrapper.offsetTop) == volumeWrapper.offsetHeight - 1) {
                volumeWrapper.onmouseup(e);
            }
        }
    };

    volumeWrapper.onmouseup = function (e) {
        /*      if (!tabId) {
                  return;
              }*/
        volumeWrapper.onmousedown(e);
        let newVolume = (e.clientX - volumeWrapper.offsetLeft) / volumeWrapper.offsetWidth;
        backgroundPage.commandListener('newVolume', tabId, {volume: newVolume});
    };
}

function setProgress(progress) {
    let progressSlider = progressWrapper.getElementsByClassName('slider_slide')[0];
    let sliderProgressPoint = progressWrapper.getElementsByClassName('slider_handler')[0];
    let progressInPercent = Math.floor(progress * 100);

    progressSlider.style.width = sliderProgressPoint.style.left =
        (progressInPercent > 0 ? (progressInPercent < 100 ? progressInPercent : 100) : 0) + '%';
}

function setVolume(volume) {
    let volumeSlider = volumeWrapper.getElementsByClassName('slider_slide')[0];
    let sliderVolumePoint = volumeWrapper.getElementsByClassName('slider_handler')[0];
    let volumeInPercent = Math.floor(volume * 100);

    volumeSlider.style.width = sliderVolumePoint.style.left =
        (volumeInPercent > 0 ? (volumeInPercent < 100 ? volumeInPercent : 100) : 0) + '%';
}

function setPlayPauseBtn(isPlaying) {
    let currentEl = document.getElementsByClassName('current')[0];
    if (isPlaying) {
        commandBtns['play-pause'].classList.add('playing');
        currentEl.classList.add('playing');
        setPlayIcon();
    } else {
        commandBtns['play-pause'].classList.remove('playing');
        currentEl.classList.remove('playing');
        setPauseIcon();
    }
}

function setPauseIcon() {
    chrome.browserAction.setIcon({path: "/images/pause.png"}, (e) => console.log(e))
}

function setPlayIcon() {
    chrome.browserAction.setIcon({path: "/images/play.png"}, (e) => console.log(e))
}

function updatePlaylistDom() {
    let lis = playlistEl.children[0].children;
    for (let i = 0; i < lis.length; i++) {
        let el = lis[i];
        if (el.classList.contains('current'))
            el.classList.remove('current');

        if (el.classList.contains('playing'))
            el.classList.remove('playing');

        if (el.dataset.songId == current[13])
            el.classList.add('current');
    }
}

function createPlaylistDOM() {
    let ul = document.createElement('ul');
    ul.id = "list";

    playlistEl.onscroll = function (e) {
        if ((e.srcElement.scrollTop + e.srcElement.offsetHeight) == e.srcElement.scrollHeight) {
            addLiItems(ul);
        }
    };
    playlistEl.innerHTML = '';
    addLiItems(ul);
    return ul;
}

function addLiItems(ul) {
    let i = 0 || numberItems;
    let max = list.length > (numberItems + 50) ? numberItems + 50 : list.length;
    for (i; i < max; i++) {
        let el = list[i];
        let li = document.createElement('li');
        li.onclick = function () {
            backgroundPage.commandListener(el[13] == current[13] ? 'play-pause' : 'new',
                tabId, {song: el});
        };

        if (el[13] == current[13])
            li.classList = 'current';

        li.dataset.songId = el[13];

        li.innerHTML = '<button class="audio_play"></button>' +
            '<span class="audio_performer">' + el[4] + '</span>' +
            '<span class="audio_divider"> – </span>' +
            '<span class="audio_title">' + el[3] + '</span> ' +
            '<span class="audio_duration">' + getFormattedDuration(el[5]) + '</span>';
        ul.appendChild(li);
    }
    numberItems = max;
    if (!ul.getElementsByClassName('current').length && numberItems < list.length) {
        addLiItems(ul);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.method == 'updateInfo') {
        command = message.executingCommand;
        updateInfo();
    }
    if (message.method == 'updateProgress') {
        if (canSetProgress) {
            command = message.executingCommand;
            setProgress(message.progress);
            if (message.isNewSong) {
                updateInfo();
            }
        }
    }
});
