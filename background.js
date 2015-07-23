/**
 * background.js
 * Background page script
 * Copyright (c) 2011 Alexey Savartsov <asavartsov@gmail.com>
 * Licensed under the MIT license
 */

var curr_song_title = '';


// Connect event handlers
chrome.runtime.onConnect.addListener(port_on_connect);

bind_keyboard_shortcuts();

/**
 * Content script has connected to the extension
 */
function port_on_connect(port) {
    port.onMessage.addListener(port_on_message);
    port.onDisconnect.addListener(port_on_disconnect);
}

 /**
  * New message arrives to the port
  * 
  * input: message is of type Player
  */
function port_on_message(message) {
    // Current player state
    var _p = message;
    var now = (new Date()).getTime();

    if (_p.has_song) {
        // if the song changed
        if (_p.song.title != curr_song_title) {
            curr_song_title = _p.song.title;
            console.log("logging song"); 
            log_song(_p.song.artist,_p.song.album_artist,
                    _p.song.album, _p.song.title,
                    Math.round(new Date().getTime() / 1000));
        }
    }
}


function log_song(artist, album_artist, album, title, time) {

    var http = new XMLHttpRequest();
    var url = "http://muslogger.appspot.com/log";
    // var url = "http://localhost:11080/log";
    var params = "artist="+artist+"&album_artist="+album_artist+"&album="+album+"&title="+title;
    http.open("POST", url, true);

    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            alert("successfully logged on muslogger");
        }
    }
    http.send(params);
/*
    // Scrobble this song
    lastfm_api.scrobble(artist, album_artist, album, title, time,
        function(response) {
            if (response.error) {
                if (response.error == 9) {
                    // Session expired
                    clear_session();
                }
                chrome.browserAction.setIcon({
                     'path': SETTINGS.error_icon });
            }
        });
*/
}

/**
* Content script has disconnected
*/
function port_on_disconnect() {
    curr_song_title = '';
    chrome.browserAction.setIcon({ 'path': SETTINGS.main_icon });
}


/**
 * Authentication link from popup window
 */
function start_web_auth() {
    var callback_url = chrome.runtime.getURL(SETTINGS.callback_file);
    chrome.tabs.create({
        'url':
            'http://www.last.fm/api/auth?api_key=' +
            SETTINGS.api_key +
            '&cb=' +
            callback_url });
}

/**
 * Clears last.fm session
 */
function clear_session() {
    lastfm_api.session = {};

    localStorage.removeItem('session_key');
    localStorage.removeItem('session_name');
}

/**
 * Toggles setting to scrobble songs or not
 */
function toggle_scrobble() {
    SETTINGS.scrobble = !SETTINGS.scrobble;
    localStorage['scrobble'] = SETTINGS.scrobble;

    // Set the icon corresponding the current scrobble state
    var icon = SETTINGS.scrobble ? SETTINGS.main_icon : SETTINGS.scrobbling_stopped_icon;
    chrome.browserAction.setIcon({ 'path': icon });
}

/**
 * Last.fm session request
 */
function get_lastfm_session(token) {
    lastfm_api.authorize(token, function(response) {
        // Save session
        if (response.session) {
            localStorage['session_key'] = response.session.key;
            localStorage['session_name'] = response.session.name;
        }
    });
}

function bind_keyboard_shortcuts() {
    chrome.commands.onCommand.addListener(
        function(command) {
            switch (command) {
                case 'toggle_play':
                    send_cmd_to_play_tab('tgl');
                    break;
                case 'prev_song':
                    send_cmd_to_play_tab('prv');
                    break;
                case 'next_song':
                    send_cmd_to_play_tab('nxt');
                    break;
                case 'goto_play_tab':
                    open_play_tab();
                    break;
                default:
                    console.error("No handler for command '" + command + "'");
            }
        }
    );
}

function send_cmd_to_play_tab(cmd) {
    find_play_tab(
        function(tab) {
            chrome.tabs.sendMessage(tab.id, {cmd: cmd}, function() {});
        }
    );
}

function open_extensions_page() {
  chrome.tabs.create({url: 'chrome://extensions/'});
}
