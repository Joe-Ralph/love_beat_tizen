var API_URL = 'https://lovebeatserver.onrender.com';
var myUuid = localStorage.getItem('myUuid');
var partnerUuid = localStorage.getItem('partnerUuid');
var navigationStack = [];

// Make all functions global
window.renderScreen = renderScreen;
window.updateBackButton = updateBackButton;
window.goBack = goBack;
window.mainScreen = mainScreen;
window.pairingScreen = pairingScreen;
window.senderScreen = senderScreen;
window.receiverScreen = receiverScreen;
window.vibrationScreen = vibrationScreen;
window.successScreen = successScreen;
window.getNewPairCode = getNewPairCode;
window.generateUuids = generateUuids;
window.startPairPolling = startPairPolling;
window.sendVibration = sendVibration;
window.vibrate = vibrate;
window.loadLottieAnimation = loadLottieAnimation;
window.getRandomLoveNote = getRandomLoveNote;

function renderScreen(screenContent, screenName) {
    document.getElementById('app').innerHTML = '<div class="screen">' + screenContent + '</div>';
    navigationStack.push(screenName);
}

function updateBackButton() {
    var backButton = document.getElementById('backButton');
    if (navigationStack.length > 1) {
        backButton.style.display = 'block';
    } else {
        backButton.style.display = 'none';
    }
}

function goBack() {
    if (navigationStack.length > 1) {
        navigationStack.pop(); // Remove current screen
        var previousScreen = navigationStack.pop(); // Get previous screen
        switch (previousScreen) {
            case 'main':
                mainScreen();
                break;
            case 'pairing':
                pairingScreen();
                break;
            case 'sender':
                senderScreen();
                break;
            case 'receiver':
                receiverScreen();
                break;
            case 'vibration':
                vibrationScreen();
                break;
            default:
                mainScreen();
        }
    } else {
    	tizen.application.getCurrentApplication().exit();
    }
}

function mainScreen() {
	function keyEventHandler(event) {
	    if (event.keyName === "back") {
	        try {
	        	goBack();
	            // If the back key is pressed, exit the application.
	        } catch (ignore) {}
	    }
	}

    renderScreen(
        '<h1>LoveBeat</h1>' +
        '<button onclick="pairingScreen()">Start</button>',
        'main'
    );
}

function pairingScreen() {
    renderScreen(
        '<h2>Choose Pairing Mode</h2>' +
        '<button onclick="senderScreen()">Seek</button>' +
        '<button onclick="receiverScreen()">Embrace</button>',
        'pairing'
    );
}

function senderScreen() {
    getNewPairCode(function(pairCode) {
        var user = generateUuids();
        var pairUrl = API_URL + '?paircode=' + pairCode + '&senderId=' + user.uuid + '&receiverId=' + user.partnerUuid;

        renderScreen(
            '<h2>Scan QR Code</h2>' +
            '<div id="qrcode"></div>',
            'sender'
        );

        new QRCode(document.getElementById("qrcode"), pairUrl);

        startPairPolling(pairCode);
    });
}

function receiverScreen() {
    getNewPairCode(function(pairCode) {
        renderScreen(
            '<h2>Enter this code on the other device</h2>' +
            '<div id="pairCode">' + pairCode + '</div>' +
            '<div id="lottieAnimation"></div>',
            'receiver'
        );

        loadLottieAnimation('pairloader');
        startPairPolling(pairCode);
    });
}

function vibrationScreen() {
    renderScreen(
        '<h2 id="loveNote">' + getRandomLoveNote() + '</h2>' +
        '<div id="lottieAnimation" style="display:none;"></div>',
        'vibration'
    );

    document.querySelector('.screen').addEventListener('click', function() {
        document.getElementById('loveNote').style.display = 'none';
        document.getElementById('lottieAnimation').style.display = 'block';
        loadLottieAnimation('heart');
        sendVibration();
    });
}

function successScreen() {
    renderScreen(
        '<h2>Pairing Successful!</h2>' +
        '<div id="lottieAnimation"></div>',
        'success'
    );

    loadLottieAnimation('pairingsuccess');
    setTimeout(function() {
        vibrationScreen();
    }, 3000);
}

function getNewPairCode(callback) {
	var pairCode = Math.floor(100000 + Math.random() * 900000);
    callback(pairCode);
}

function generateUuids() {
    return {
        uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }),
        partnerUuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
    };
}

function startPairPolling(pairCode) {
    function poll() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', API_URL + '/pair/' + pairCode, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var data = JSON.parse(xhr.responseText);
                    myUuid = data.myUuid;
                    partnerUuid = data.partnerUuid;
                    localStorage.setItem('myUuid', myUuid);
                    localStorage.setItem('partnerUuid', partnerUuid);
                    successScreen();
                } else {
                    setTimeout(poll, 5000);
                }
            }
        };
        xhr.send();
    }
    poll();
}

function sendVibration() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', API_URL + '/vibrate', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                console.log('Vibration sent successfully');
                vibrate();
            } else {
                console.error('Failed to send vibration');
            }
        }
    };
    xhr.send(JSON.stringify({
        senderId: myUuid,
        receiverId: partnerUuid
    }));
}

function vibrate() {
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

function loadLottieAnimation(animationName) {
    var animation = lottie.loadAnimation({
        container: document.getElementById('lottieAnimation'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'animations/' + animationName + '.json'
    });
}

function getRandomLoveNote() {
    var loveNotes = [
        "Thinking of you",
        "Miss you",
        "Love you",
        "You're amazing",
        "Can't wait to see you"
    ];
    return loveNotes[Math.floor(Math.random() * loveNotes.length)];
}


// Start the app
mainScreen();