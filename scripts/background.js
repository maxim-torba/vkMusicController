window.tabId = 0;
window.isExecutedContentScript = false;

let cNext = 'getAudioPlayer().playNext();';

let cPrevious = 'getAudioPlayer().playPrev();';

let cNew = 'getAudioPlayer().play(\'';

let cPlayPause = 'p = getAudioPlayer();\
p.isPlaying() ? p.pause() : p.play();';

let cNewVolume = 'getAudioPlayer().setVolume(';

let cNewProgress = 'getAudioPlayer().seek(';

let scriptInjectPreCode = 'scriptContent = "';

let scriptInjectAfterCode = '"; script = document.createElement("script");\
script.appendChild(document.createTextNode(scriptContent));\
document.body.appendChild(script);\
script.parentNode.removeChild(script);';

window.commandListener = function commandListener(executingCommand, id, options) {
    chrome.tabs.query({'audible': true, 'url': 'https://vk.com/*'}, function (tabs) {
        let code = '';
        let curId = 0;

        switch (executingCommand) {
            case 'play-pause':
                code = cPlayPause;
                break;
            case 'next':
                code = cNext;
                break;
            case 'previous':
                code = cPrevious;
                break;
            case 'new':
                let song = options.song;
                code = cNew + song[1] + '_' + song[0] + '\', window.listInfo)';
                break;
            case 'newVolume':
                code = cNewVolume + options.volume + ');';
                break;
            case 'newProgress':
                code = cNewProgress + options.progress + ');';
                break;
        }

        try {
            curId = tabs[0].id;
        }
        catch (err) {
            curId = window.tabId ? window.tabId : id;
        }
        window.tabId = curId;

        chrome.tabs.executeScript(curId, {'code': scriptInjectPreCode + code + scriptInjectAfterCode}, function () {
            chrome.runtime.sendMessage({
                method: 'updateInfo',
                executingCommand: executingCommand
            });
        });
    });
};

chrome.commands.onCommand.addListener(window.commandListener);

chrome.tabs.onUpdated.addListener((id) => {
    if (id == tabId)
        window.isExecutedContentScript = false;
});

setInterval(() => {
    if (window.tabId) {
        chrome.tabs.sendMessage(tabId, {method: "getIsPlaying"}, (response) => {
               if (!response) {
                   return;
               }
            isPlaying = JSON.parse(response.isPlaying);
            setPlayPauseBtn(isPlaying);
        });
    }
}, 500);

function setPlayPauseBtn(isPlaying) {
    if (isPlaying) {
        setPauseIcon();
    } else {
        setPlayIcon();
    }
}

function setPauseIcon() {
    chrome.browserAction.setIcon({path: "../images/pause.png"});
}

function setPlayIcon() {
    chrome.browserAction.setIcon({path: "../images/play.png"});
}
