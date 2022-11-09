require('dotenv').config();

const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .alias('d', 'date')
    .nargs('d', 1)
    .describe('d', 'date used to delete tweets in yyyy-mm-dd')
    .alias('n', 'number')
    .nargs('n', 1)
    .describe('n', 'number of tweets to delete')
    .default('n', 100)
    .demand(['d'])
    .help('h')
    .alias('h', 'help')
    .argv;

const fs = require('fs');
const Twitter = require('twitter');

console.log("Reading tweet.js file");
let tweetData;
try {
    tweetData = JSON.parse(readJson('tweet.js'));
} catch (e) {
    console.error("tweet.js not found or invalid format", e);
    process.exit();
}

let results = [];
try {
    results = JSON.parse(readJson('deleted.js'));
} catch (e) {
    writeResult(results)
}

let count = 0;
const cutOffDate = Date.parse(argv.d);

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

console.log(`Deleting tweets before ${argv.d}`);
console.log(`Found ${tweetData.length} tweets in total`);

tweetData.forEach(({tweet}) => {
    const id_str = tweet.id;
    const created_at = new Date(tweet.created_at);

    if (!results.includes(id_str) && count < argv.n && created_at < cutOffDate) {
        client.post(`statuses/destroy/${id_str}.json`, function (error) {
            if (error) {
                console.log(`Error received: ${JSON.stringify(error)}`)
                const {code, message} = error[0]
                if (code === 144) {
                    results.push(id_str);
                } else {
                    console.error(`Error deleting tweet id: ${id_str}, created at ${created_at}, reason: ${message}`)
                }
            } else {
                results.push(id_str);
                count++;
                console.log(`Deleted tweet id: ${id_str}, created at ${created_at}`)
            }
        });
    }
});

writeResult(results);
console.log("Finish deleting tweets");

function readJson(filename) {
    return fs.readFileSync(`./${filename}`, 'utf8', function (err, data) {
        if (err) throw err;
        return data;
    }).replace(/window.YTD.tweets.part0 = /g, '');
}

function writeResult(results) {
    const file = fs.createWriteStream('deleted.js');
    file.on('error', function (err) { /* error handling */
    });
    file.write(JSON.stringify(results));
    file.end();
}
