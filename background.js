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
                    Math.round(new Date().getTime() / 1000), false);
        }
    }
}


function log_song(artist, album_artist, album, title, time, attempted) {

    var http = new XMLHttpRequest();
    var url = "http://muslogger.appspot.com/log";
    var tz = jstz.determine().name();
    var params = "artist="+artist+"&album_artist="+album_artist+"&album="+album+"&title="+title+"&tz="+tz;
    http.open("POST", url, true);

    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    http.onreadystatechange = function() {//Call a function when the state changes.
        if(http.readyState == 4 && http.status == 200) {
            alert("successfully logged on muslogger");
        }
        // if not logged in to muslogger
        if(http.status == 405 && !attempted) {
            start_web_auth();
            log_song(artist, album_artist, album, title, time, true);
        }
    }
    http.send(params);
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
    chrome.tabs.create({
        'url' : 'http://www.muslogger.appspot.com/login'});
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
