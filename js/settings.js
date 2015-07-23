var SETTINGS = {

    scrobble_point: .7,
    scrobble_interval: 420, // 7 minutes
    max_scrobbles: Number.POSITIVE_INFINITY,

    refresh_interval: 2
};

SETTINGS.max_scrobbles = localStorage['max_scrobbles'] &&
                            parseInt(localStorage['max_scrobbles']) ||
                            SETTINGS.max_scrobbles;

// This enables scrobbling by default
SETTINGS.scrobble = !(localStorage["scrobble"] == "false");
