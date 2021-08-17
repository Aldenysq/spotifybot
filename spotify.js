require('dotenv').config()
var SpotifyWebApi = require('spotify-web-api-node');
const db = require('./db');
const request = require('request');

var scopes = ['ugc-image-upload', 'user-read-recently-played', 'user-top-read', 'user-read-playback-position', 'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing', 'app-remote-control', 'streaming', 'playlist-modify-public', 'playlist-modify-private', 'playlist-read-private', 'playlist-read-collaborative', 'user-follow-modify', 'user-follow-read', 'user-library-modify', 'user-library-read', 'user-read-email', 'user-read-private'];

const testUri = 'http://localhost:3000/authorize';
const realUri = 'https://tspotybot.herokuapp.com/authorize';

var credentials = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: realUri
};

let spotifyApi;

function getLink() {
  spotifyApi = new SpotifyWebApi(credentials);
  return spotifyApi.createAuthorizeURL(scopes);
}


async function registerUser(code){
  spotifyApi = new SpotifyWebApi(credentials);
  const data = await spotifyApi.authorizationCodeGrant(code);

  const access_token = data.body['access_token'];
  const refresh_token = data.body['refresh_token'];

  const username = await db.getLatestUsername();

  await db.addUser(username, refresh_token);

  // Set the access token on the API object to use it in later calls
  // spotifyApi.setAccessToken(data.body['access_token']);
  // spotifyApi.setRefreshToken(data.body['refresh_token']);
}

async function setAccessToken(username) {
  spotifyApi = new SpotifyWebApi(credentials);
  const userData = await db.retrieveUserData(username);
  spotifyApi.setRefreshToken(userData['refresh_token']);
  const spotifyData = await spotifyApi.refreshAccessToken()
  const access_token = spotifyData.body['access_token'];
  spotifyApi.setAccessToken(access_token);
  return access_token;
}

async function getMe(username) {
  await setAccessToken(username);
  return await spotifyApi.getMe();
}

async function currentTrack(username) {
  await setAccessToken(username);
  return await spotifyApi.getMyCurrentPlayingTrack();
}

async function getMyTopArtists(username, limit) {
  await setAccessToken(username);
  return await spotifyApi.getMyTopArtists({'limit': limit});
}

async function getMyTopTracks(username, limit) {
  await setAccessToken(username);
  return await spotifyApi.getMyTopTracks({'limit': limit});
}

async function recentlyPlayedTracks(username, limit) {
  await setAccessToken(username);
  return await spotifyApi.getMyRecentlyPlayedTracks({'limit': limit});
}

async function setVolume(username, volume) {
  await setAccessToken(username);
  return await spotifyApi.setVolume(volume);
}

async function pause(username) {
  await setAccessToken(username);
  return await spotifyApi.pause();
}

async function resume(username) {
  await setAccessToken(username);
  return await spotifyApi.play();
}

async function myDevices(username) {
  await setAccessToken(username);
  return await spotifyApi.getMyDevices();
}

async function trasferPlayback(username, deviceid) {
  await setAccessToken(username);
  await spotifyApi.transferMyPlayback([deviceid]);
}

async function seek(username, milisec) {
  await setAccessToken(username);
  await spotifyApi.seek(milisec);
}

async function next(username) {
  await setAccessToken(username);
  await spotifyApi.skipToNext();
}

async function previous(username) {
  await setAccessToken(username);
  await spotifyApi.skipToPrevious();
}

async function getRecommendations(username, limit, seed_tracks=[], seed_artists=[]) {
  await setAccessToken(username);
  // let data = await spotifyApi.searchArtists('Платина'); //'4TzGOY9RpErzedN02w8Boh'
  // console.log(data.body.artists.items);
  // return;
  let options = {
    seed_tracks: seed_tracks,
    seed_artists: seed_artists,
    limit: limit
  };
  return await spotifyApi.getRecommendations(options);
}

async function addToQueue(username, trackUri) {
  const token = await setAccessToken(username);
  let headers = {
    'Authorization': 'Bearer ' + token
  };
  let options = {
    url: 'https://api.spotify.com/v1/me/player/queue?uri=' + trackUri,
    headers: headers
  };
  await request.post(options);
}

module.exports = {
  getLink,
  registerUser,
  getMe,
  currentTrack,
  getMyTopArtists,
  getMyTopTracks,
  recentlyPlayedTracks,
  setVolume,
  pause,
  resume,
  myDevices,
  trasferPlayback,
  seek,
  next,
  previous,
  getRecommendations,
  addToQueue
};
