// VibrationService.js

function VibrationService() {
    this.isVibrating = false;
    this.pollInterval = null;
    this.client = new XMLHttpRequest();
}

VibrationService.prototype.startPolling = function(userId, onVibrationReceived) {
    var self = this;
    this.pollInterval = setInterval(function() {
        self.pollForVibrations(userId, function(success) {
            if (success) {
                onVibrationReceived(true);
            }
        });
    }, 2 * 60 * 1000); // Poll every 2 minutes
};

VibrationService.prototype.sendVibration = function(senderUuid, receiverUuid) {
    var self = this;
    var json = JSON.stringify({
        senderId: senderUuid,
        receiverId: receiverUuid
    });

    var request = new XMLHttpRequest();
    request.open('POST', 'https://lovebeatserver.onrender.com/vibrate', true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200) {
                console.log("Vibration sent successfully - " + request.responseText);
                self.vibrate();
            } else {
                console.log("Failed to send vibration");
            }
        }
    };

    request.send(json);
};

VibrationService.prototype.vibrate = function() {
    this.isVibrating = true;
    // Tizen vibration API
    tizen.humanactivitymonitor.start('VIBRATION', {
        duration: 1000,
        intensity: 1.0
    });
    this.isVibrating = false;
};

VibrationService.prototype.vibrateInPattern = function() {
    this.isVibrating = true;
    var pattern = [0, 293, 673, 557, 678, 355, 0];
    // Tizen vibration API
    tizen.humanactivitymonitor.start('VIBRATION', {
        pattern: pattern,
        repeat: -1
    });
    this.isVibrating = false;
};

VibrationService.prototype.pollForVibrations = function(userId, callback) {
    var self = this;
    var request = new XMLHttpRequest();
    request.open('GET', 'https://lovebeatserver.onrender.com/poll/' + userId, true);

    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if (request.status === 200) {
                var responseText = request.responseText;
                if (responseText) {
                    var jsonResponse = JSON.parse(responseText);
                    if (jsonResponse.vibrate) {
                        var senderId = jsonResponse.from;
                        console.log("Received vibration from " + senderId);
                        self.vibrateInPattern();
                        callback(true);
                        return;
                    }
                } else {
                    console.log("Empty response body");
                }
            } else {
                console.log("Failed to poll for vibrations");
            }
            callback(false);
        }
    };

    request.send();
};

// Usage example
var vibrationService = new VibrationService();
vibrationService.startPolling('userId', function(success) {
    if (success) {
        console.log("Vibration received");
    }
});