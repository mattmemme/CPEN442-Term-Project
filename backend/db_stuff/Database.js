const { MongoClient } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v4.2+ - [API Documentation](http://mongodb.github.io/node-mongodb-native/4.2/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		MongoClient.connect(
			mongoUrl,
			{
				useNewUrlParser: true
			},
			(err, client) => {
				if (err) reject(err);
				else {
					console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
					resolve(client.db(dbName));
				}
			}
		)
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}


Database.prototype.getPublicKey = function(handle) {
    return this.connected.then(db =>
		new Promise((resolve, reject) => {
			if (!handle) {
                reject(new Error('Invalid input'));
			}

            db.collection('pubkeys').findOne({ handle: handle }).then(dbEntry => {
                if (dbEntry && dbEntry.public_key && dbEntry.handleTimeout && dbEntry.twitter_id) {
                    resolve({publicKey: dbEntry.public_key, handleTimeout: dbEntry.handleTimeout, twitterID: dbEntry.twitter_id, keyCreationTime: dbEntry.keyCreationTime});
                } else {
                    reject(new Error('No key found'));
                }
            }).catch((err) => {
                reject(new Error(err))
            })
        })
	)
}


Database.prototype.storePublicKey = function(document) {
    let { twitterId, publicKey, recoveryCodes, handle } = document;

	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			if (!twitterId || !publicKey) {
				reject(new Error("Invalid input"));
			}

			db.collection('pubkeys').findOne({ twitter_id: twitterId }).then(dbEntry => {
				if (dbEntry) {
					resolve(null);
				} else {
					var pubKeyEntry = {
						"twitter_id": twitterId,
						"public_key": publicKey,
						"recovery_codes": recoveryCodes,
						"keyCreationTime": Date.now(),
						"handle": handle,
						"handleTimeout": Date.now() + 1000 * 60 * 10
					}
		
					db.collection('pubkeys').insertOne(pubKeyEntry).then(() => {
						resolve(pubKeyEntry);
					}).catch(() => {
						reject(new Error("Issue accepting publicKey"));
					})
				}
			})
        })
	)
}

Database.prototype.getRecoveryCodes = function(twitterId) {
    return this.connected.then(db =>
		new Promise((resolve, reject) => {
			if (!twitterId) {
                reject(new Error('Invalid input'));
			}

            db.collection('pubkeys').findOne({ twitter_id: twitterId }).then(dbEntry => {
                if (dbEntry && dbEntry.recovery_codes) {
                    resolve(dbEntry.recovery_codes);
                } else {
                    reject(new Error('No recovery codes found'));
                }
            }).catch((err) => {
                reject(new Error(err))
            })
        })
	)
}

Database.prototype.updatePublicKey = function(twitterId, newPublicKey, newRecoveryCodes) {
    return this.connected.then(db =>
		new Promise((resolve, reject) => {
			if (!twitterId) {
                reject(new Error('Invalid input'));
			}

			const updateDoc = {
				$set: {
					public_key: newPublicKey,
					recovery_codes: newRecoveryCodes,
					keyCreationTime: Date.now(),
				}
			}

            db.collection('pubkeys').updateOne({ twitter_id: twitterId }, updateDoc).then(dbEntry => {
				console.log(dbEntry);
                if (dbEntry && dbEntry.acknowledged && dbEntry.modifiedCount == 1) {
                    resolve(dbEntry.modifiedCount);
                } else {
                    reject(new Error('No key found'));
                }
            }).catch((err) => {
                reject(new Error(err))
            })
        })
	)
}

Database.prototype.updateHandle = function(twitterID, handle){
	return this.connected.then(db => {
		new Promise((resolve, reject) => {
			if (!twitterID)
				reject(new Error("Invalid ID"));
			
			const updateDoc = {
				$set: {
					handle: handle,
					handleTimeout: Date.now() + 1000 * 60 * 10
				}
			};

			db.collection('pubkeys').updateOne({ twitter_id: twitterID }, updateDoc).then(dbEntry => {
				console.log(dbEntry);
                if (dbEntry && dbEntry.acknowledged && dbEntry.modifiedCount == 1) {
                    resolve(dbEntry.modifiedCount);
                } else {
                    reject(new Error('No key found'));
                }
            }).catch((err) => {
                reject(new Error(err))
            })



		})
	})
}

module.exports = Database;