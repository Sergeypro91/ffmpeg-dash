const express = require('express');

const torrentStreamRouter = require('./torrenStream/torrenStream.router');

const api = express.Router();

api.use('/torrentStream', torrentStreamRouter);

module.exports = api;
