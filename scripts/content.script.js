(function () {
    let getListScript = 'try{\
    window.list = getAudioPlayer().getCurrentPlaylist()._ref._list;\
    window.listInfo = getAudioPlayer().getCurrentPlaylist()._ref;\
} catch (err) {\
    window.list = getAudioPlayer().getCurrentPlaylist()._list;\
    window.listInfo = getAudioPlayer().getCurrentPlaylist();\
}\
localStorage.setItem("list", JSON.stringify(window.list));';

    let getIsPlayingScript = 'localStorage.setItem("isPlaying", window.getAudioPlayer().isPlaying());';

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
        if (message.method == "getAudioPlayer") {
            currentSong = localStorage.getItem('audio_v20_track');
            isPlaying = localStorage.getItem('isPlaying');
            sendResponse({
                list: localStorage.getItem('list'),
                current: currentSong,
                isPlaying: isPlaying,
                volume: localStorage.getItem('audio_v20_vol')
            });
        }
        if (message.method === "getIsPlaying") {
            executeScript(getIsPlayingScript);
            isPlaying = localStorage.getItem('isPlaying');
            sendResponse({
                isPlaying: isPlaying
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
            } catch (err) {
            }
        }
    }

    setInterval(sendProgress, 500);
}());