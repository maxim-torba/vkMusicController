let getListScript = 'try{\
    window.list = getAudioPlayer()._currentPlaylist._ref._list;\
    window.listInfo = getAudioPlayer()._currentPlaylist._ref;\
} catch (err) {\
    window.list = getAudioPlayer()._currentPlaylist._list;\
    window.listInfo = getAudioPlayer()._currentPlaylist;\
}\
localStorage.setItem("list", JSON.stringify(window.list));';

let getIsPlayingScript = 'localStorage.setItem("isPlaying", window.getAudioPlayer()._isPlaying);';

let currentSong = '';
let isPlaying = false;

function executeScript(scriptContent) {
    script = document.createElement('script');
    script.appendChild(document.createTextNode(scriptContent));
    document.body.appendChild(script);
    script.parentNode.removeChild(script);
}

executeScript(getListScript);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    executeScript(getIsPlayingScript);
    if (message.method == "getAudioPlayer") {
        currentSong = localStorage.getItem('audio_v20_track');
        isPlaying = localStorage.getItem('isPlaying');
        sendResponse({
            list: localStorage.getItem('list'),
            current: currentSong,
            isPlaying: isPlaying,
            volume: localStorage.getItem('audio_v20_vol')
            // progress: localStorage.getItem('audio_v20_progress')
        });
    }
});

function sendProgress() {
    if (isPlaying) {
        try {
            chrome.runtime.sendMessage({
                method: 'updateProgress',
                progress: localStorage.getItem('audio_v20_progress'),
                executingCommand: 'newProgress',
                isNewSong: currentSong != localStorage.getItem('audio_v20_track')
            });
        }
        catch (err) {
        }
    }
}

setInterval(sendProgress, 500);
