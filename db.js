require('dotenv').config()
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const db = client.db("data");
const collection = db.collection("users");

async function addUser(username, access_token, refresh_token) {
  await collection.insertOne({
  	'username' : username,
  	'refresh_token' : refresh_token
  });
  console.log('new username ' + username + ' created successfully')
}

async function retrieveUserData(username) {
	const data = await collection.find({'username' : username}).toArray();
	return data[0];
}

async function isRegistered(username) {
	const users = await collection.find({'username' : username}).toArray();
	return (users.length > 0);
}


async function main() {
  await client.connect();
  console.log('db client connected');
}
main();

module.exports = {
  addUser,
  retrieveUserData,
  isRegistered
};