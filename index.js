require('dotenv').config();

var argv = require('yargs')
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
    .argv

var fs = require('fs');
var Twitter = require('twitter');

console.log("Reading tweet.js file");
var tweetData = JSON.parse(readJson('tweet.js'));
var results = JSON.parse(readJson('deleted.js'));
var count = 0;
var cutOffDate = Date.parse(argv.d);

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

console.log(`Deleting tweets before ${argv.d}`);
console.log(`Found ${tweetData.length} tweets in total`);

for (var tweet in tweetData) {
    ({ id_str } = tweetData[tweet]);
    var created_at = new Date(tweetData[tweet].created_at);

    if (!results.includes(id_str) && count < argv.n && created_at < cutOffDate) {
        console.log(`Deleting tweet id: ${id_str}, created at ${created_at}`)
        client.post(`statuses/destroy/${id_str}.json`, function (error) {
            if (error) {
                console.log(error);
            };
            count++;
        });
        results.push(id_str);
    }
}

writeResult(results);
console.log("Finish deleting tweets");

function readJson(filename) {
    return fs.readFileSync(`./${filename}`, 'utf8', function (err, data) {
        if (err) throw err;
        return data;
    }).replace(/window.YTD.tweet.part0 = /g, '');
}

function writeResult(results) {
    var file = fs.createWriteStream('deleted.js');
    file.on('error', function (err) { /* error handling */ });
    file.write(JSON.stringify(results));
    file.end();
}