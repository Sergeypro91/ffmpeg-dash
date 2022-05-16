const express = require('express');

const { httpGetTorrentStream } = require('./torrenStream.controller');

const torrenStreamRouter = express.Router();

torrenStreamRouter.get('/', httpGetTorrentStream);

module.exports = torrenStreamRouter;
