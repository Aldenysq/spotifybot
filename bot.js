require('dotenv').config()
const TeleBot = require('telebot');
const bot = new TeleBot({
  token: process.env.TELEGRAM_BOT_TOKEN,
  usePlugins: ['commandButton']
});
const db = require('./db');
const spotify = require('./spotify')

async function register(msg) {
  const username = msg.from.username;
  if (await db.isRegistered(username)) {
    msg.reply.text('You are already registered. You can use my commands :)');
    return;
  }
  const link = spotify.getLink();
  await msg.reply.text('Hello, in order for me to work, please authorize via spotify (go to link)')
  await msg.reply.text(link);
}
bot.on('/register', register);

async function getMe(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }

  const meData = await spotify.getMe(username);
  let replyText = "Your display name is " + meData.body.display_name + "\n";
  replyText += "Your email is " + meData.body.email + "\n";
  replyText += "Your country is " + meData.body.country + "\n";
  replyText += meData.body.followers.total + " people follow you";
  msg.reply.text(replyText);
}
bot.on('/getMe', getMe);

async function currentTrack(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }

  const currentTrack = await spotify.currentTrack(username);
  const trackName = currentTrack.body.item.name;
  const artists = currentTrack.body.item.artists;
  const img = currentTrack.body.item.album.images[0].url;
  let replyText = "You are listening to " + trackName + " by ";
  for (artist of artists) {
    replyText += artist.name + ", ";
  }
  replyText = replyText.slice(0, -2);
  await msg.reply.text(replyText);
  await msg.reply.photo(img);
}
bot.on('/currentTrack', currentTrack);

async function topArtists(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }

  let textArray = msg.text.split(' ');
  let limit = 5;
  if (textArray.length > 1) {
    if (isNaN(textArray[1])) {
      msg.reply.text('Wrong format; please see /help');
      return;
    }
    limit = parseInt(textArray[1]);
    limit = Math.min(limit, 50);
    limit = Math.max(limit, 1);
  }

  let topArtists = await spotify.getMyTopArtists(username, limit);
  topArtists = topArtists.body.items;
  for (let i = limit - 1; i >= 0; i--) {
    let replyText = "Your *#" + (i+1) + " *favourite artist is *" + topArtists[i].name;
    replyText += "* with _" + topArtists[i].followers.total + "_ subscribers\n";
    replyText += "The artist's genres are: ";
    for (genre of topArtists[i].genres) {
      replyText += genre + ", ";
    }
    replyText = replyText.slice(0, -2);
    await msg.reply.text(replyText, {parseMode: 'Markdown' });
    await msg.reply.photo(topArtists[i].images[0].url);
  }

}
bot.on('/topArtists', topArtists);

async function topTracks(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  
  let textArray = msg.text.split(' ');
  let limit = 5;
  if (textArray.length > 1) {
    if (isNaN(textArray[1])) {
      msg.reply.text('Wrong format; please see /help');
      return;
    }
    limit = parseInt(textArray[1]);
    limit = Math.min(limit, 50);
    limit = Math.max(limit, 1);
  }

  let topTracks = await spotify.getMyTopTracks(username, limit);
  topTracks = topTracks.body.items;
  for (let i = limit - 1; i >= 0; i--) {
    let replyText = "Your *#" + (i+1) + " *favourite track is *" + topTracks[i].name;
    replyText += "* _by_ ";
    for (artist of topTracks[i].artists) {
      replyText += '*' + artist.name + "*, ";
    }
    replyText = replyText.slice(0, -2);
    replyText += '\n';
    replyText += 'Released on _' + topTracks[i].album.release_date + '_\n';
    let durationSec = Math.floor((parseInt(topTracks[i].duration_ms))/1000);
    const durationMin = Math.floor(durationSec/60);
    durationSec = durationSec % 60;
    replyText += "Duration: _" + durationMin + ":" + (durationSec < 10 ? '0' : '') + durationSec + "_"; 
    await msg.reply.text(replyText, {parseMode: 'Markdown' });
    await msg.reply.photo(topTracks[i].album.images[0].url);
    if (topTracks[i].preview_url != null) // if tracks was deleted, there is no preview_url
      await msg.reply.audio(topTracks[i].preview_url);
    if (i % 10 == 0) // at most 30 messages per seconds for telegram bot; each track requires 3; in this way, we can send all tracks
      await sleep(1);
    
  }

}
bot.on('/topTracks', topTracks);


async function recentlyPlayedTracks(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  
  let textArray = msg.text.split(' ');
  let limit = 5;
  if (textArray.length > 1) {
    if (isNaN(textArray[1])) {
      msg.reply.text('Wrong format; please see /help');
      return;
    }
    limit = parseInt(textArray[1]);
    limit = Math.min(limit, 50);
    limit = Math.max(limit, 1);
  }

  let recentlyPlayedTracks = await spotify.recentlyPlayedTracks(username, limit);
  recentlyPlayedTracks = recentlyPlayedTracks.body.items;
  for (let i = limit - 1; i >= 0; i--) {
    let replyText = "Your *#" + (i+1) + "* last played track was *" + recentlyPlayedTracks[i].track.name;
    replyText += "* _by_ ";
    for (artist of recentlyPlayedTracks[i].track.artists) {
      replyText += '*' + artist.name + "*, ";
    }
    replyText = replyText.slice(0, -2);
    replyText += '\n';
    let timePlayed = recentlyPlayedTracks[i].played_at.slice(0, -5).split('T');
    replyText += 'You played it on _' + timePlayed[0] + ' ' + timePlayed[1] + '_ UTC\n';
    await msg.reply.text(replyText, {parseMode: 'Markdown' });
    await msg.reply.photo(recentlyPlayedTracks[i].track.album.images[0].url);
    if (recentlyPlayedTracks[i].track.preview_url != null) // if tracks was deleted, there is no preview_url
      await msg.reply.audio(recentlyPlayedTracks[i].track.preview_url);
    if (i % 10 == 0) // at most 30 messages per seconds for telegram bot; each track requires 3; in this way, we can send all tracks
      await sleep(1);
    
  }
}
bot.on('/recentlyPlayedTracks', recentlyPlayedTracks);

async function setVolume(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  let textArray = msg.text.split(' ');
  if (textArray.length == 1) {
    msg.reply.text('Wrong format; please see /help');
    return;
  }
  if (isNaN(textArray[1])) {
    msg.reply.text('Wrong format; please see /help');
    return;
  }
  let volume = parseInt(textArray[1]);
  volume = Math.min(volume, 100);
  volume = Math.max(volume, 0);

  await spotify.setVolume(username, volume);
  
}
bot.on('/setVolume', setVolume);

async function pause(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  try {
    await spotify.pause(username);
    msg.reply.text('Paused!');
  } catch (e) {
    msg.reply.text('You are not listening to anything right now');
  }
  
  
}
bot.on('/pause', pause);

async function resume(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  try {
    await spotify.resume(username);
    msg.reply.text('Resumed!');
  } catch (e) {
    msg.reply.text('Either you have no currently active device or you are already listening');
  }
  
  
}
bot.on('/resume', resume);

async function myDevices(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  
  let devices = await spotify.myDevices(username);
  devices = devices.body.devices;
  let replyText = 'Your devices: \n';
  for (device of devices) {
    if (device.is_active) 
      replyText += '*ACTIVE* ';
    replyText += device.type + " " + device.name + "\n";
  }
  msg.reply.text(replyText, {parseMode: 'Markdown' });
  
}
bot.on('/myDevices', myDevices);

async function transferPlayback(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }

    let devices = await spotify.myDevices(username);
    devices = devices.body.devices;
    let buttonsArray = [];
    for (device of devices) {
      let buttonText = '';
      // if (device.is_active) 
      //   buttonText += 'ACTIVE ';
      buttonText += device.type + " " + device.name;
      const callbackData = device.id;
      buttonsArray.push([bot.inlineButton(buttonText, {callback: callbackData})]);
    }
    const replyMarkup = bot.inlineKeyboard(buttonsArray);
    // Send message with keyboard markup
    return bot.sendMessage(msg.from.id, 'Please choose device that you want to transfer your playback to', {replyMarkup});

}
bot.on('/transferPlayback', transferPlayback);

bot.on('callbackQuery', async (msg) => {
    const username = msg.from.username;
    await spotify.trasferPlayback(username, msg.data);
    bot.sendMessage(msg.from.id, 'Transfered your playback!')
    bot.answerCallbackQuery(msg.id);
});

async function seek(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  let text = msg.text.split(' ');
  if (text.length == 1) {
    msg.reply.text('Wrong format; please see /help');
    return;
  }
  const minSec = text[1].split(':');
  if (minSec.length != 2 || isNaN(minSec[0]) || isNaN(minSec[1])){
    msg.reply.text('Wrong format; please see /help');
    return;
  }
  const min = parseInt(minSec[0]);
  const sec = parseInt(minSec[1]);
  const milisec = (min * 60 + sec) * 1000;
  try {
  await spotify.seek(username, milisec);
  msg.reply.text('Positioned sought!');
  } catch (e) {
  msg.reply.text('No active session');
  }
  
}
bot.on('/seek', seek);

async function next(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  try {
    await spotify.next(username);
    msg.reply.text('Track skipped');
  } catch (e) {
    msg.reply.text('No active session');
  }
  
}
bot.on('/next', next);

async function previous(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  try {
    await spotify.previous(username);
    msg.reply.text('Playing previous track');
  } catch (e) {
    msg.reply.text('No active session');
  }
  
}
bot.on('/previous', previous);

async function getRecommendations(msg) {
  const username = msg.from.username;
  if (!(await db.isRegistered(username))) {
    msg.reply.text('You are not registered. Please, type /register first');
    return;
  }
  let text = msg.text.split(' ');
  let limit = 3;
  if (text.length > 1) {
    if (isNaN(text[1])) {
      msg.reply.text('Wrong format; please see /help');
      return;
    }
    limit = parseInt(text[1]);
    limit = Math.min(limit, 10);
    limit = Math.max(limit, 1);
  }
  let previousTracks = await spotify.recentlyPlayedTracks(username, 5);
  previousTracks = previousTracks.body.items;
  let seed_tracks = [];
  for (track of previousTracks) {
    seed_tracks.push(track.track.id);
  }
  let recommendedTracks = await spotify.getRecommendations(username, seed_tracks, limit);
  recommendedTracks = recommendedTracks.body.tracks;
  for (track of recommendedTracks) {
    let replyText = '';
    for (artist of track.artists) {
      replyText += '*' + artist.name + '*, ';
    }
    replyText = replyText.slice(0, -2);
    replyText += ' _';
    replyText += track.name;
    replyText += '_';
    await msg.reply.text(replyText, {parseMode: 'Markdown'});
    await msg.reply.photo(track.album.images[0].url);
    if (track.preview_url != null)
      await msg.reply.audio(track.preview_url);
    await spotify.addToQueue(username, track.uri);
  }
  await msg.reply.text('I added the tracks to your listening queue. Enjoy!');
  
}
bot.on('/getRecommendations', getRecommendations);


async function help(msg) {
  const username = msg.from.username;
  let replyText = "Hello, " + username +'! I am Spotify bot.\n';
  replyText += "Here you can find most of the functionality of regular Spotify app *plus* some other fancy commands\n";
  replyText += "Before using me, please register with '/register' command\n";
  replyText += "*Some commands might not work if you are not premium user of Spotify.*\n";
  replyText += "My commands:\n";
  replyText += "/help *- see complete list of my commands *\n";
  replyText += "/register *- register to let me access your spotify data; should be done before using any commands *\n";
  replyText += "/getMe *- get basic information about your account *\n";
  replyText += "/currentTrack *- get information about current playing track *\n";
  replyText += "/topArtists {<limit>} *- get your top artists; limit ranges from 1 to 50; by default is 5 *\n";
  replyText += "/topTracks {<limit>} *- get your top tracks; limit ranges from 1 to 50; by default is 5; * _if tracks was deleted, there would be no audio preview_\n";
  replyText += "/recentlyPlayedTracks {<limit>} *- get your last played tracks; limit ranges from 1 to 50; by default is 5;*\n";
  replyText += "/setVolume <volume> *- set your volume value to <volume>. Does not work on IOS devices due to limitations from Spotify.*\n";
  replyText += "/pause *- pause your current playback.*\n";
  replyText += "/resume *- resume/start your playback on your currently active device.*\n";
  replyText += "/myDevices *- see list of your Spotify devices*\n";
  replyText += "/transferPlayback *- transfer playback to your other device*\n";
  replyText += "/seek <min:sec> *- seek to position in currently playing track*\n";
  replyText += "/next *- skip current track*\n";
  replyText += "/previous *- play previous track*\n";
  replyText += "/getRecommendations {<limit>} *- get recommended tracks based on your last five listened tracks; adds tracks to your listening queue; limit ranges from 1 to 10; by default is 3.*\n";
  replyText += "Arguments in _{}_ are *optional*\n";
  replyText += "_Note, if you are asking too many queries, bot might not respond for some time due to limitations from spotify and telegram api_\n";
  msg.reply.text(replyText, {parseMode: 'Markdown' });
}
bot.on('/help', help);

bot.start();




function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
