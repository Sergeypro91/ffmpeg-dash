const fs = require('fs');

async function httpGetTorrentStream(req, res) {
    const file = fs.readFileSync(__dirname + '/4sec/BigBuckBunny_4s_simple_2014_05_09.mpd', 'binary');

    res.writeHead(200, {'Content-Length': file.length, 'Content-Type': 'application/dash+xml'});
    res.write(file, 'binary');
    res.end();

    // res.send('Hello World!')
}

module.exports = {
    httpGetTorrentStream,
};
