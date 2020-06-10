# delete-old-tweets

A simple script that deletes your old tweets based on a given cut off
date.

Due to twitter's API
[rate limit](https://help.twitter.com/en/rules-and-policies/twitter-limits),
the script has been limited to 100 deletes per execution. There is also
a hard limit of 2400 updates to tweets per day. _Please be aware of the
rate limits, otherwise your account may be suspended._

## Installation

- `npm install`

## Quick Start

- Request your twitter data from Twitter
  [(link)](https://twitter.com/settings/your_twitter_data). You will
  receive an email in your email with a download link to your data, this
  may take a some time especially if you have a lot of twitter data.
- You need a valid Twitter developer credentials in the form of a set of
  consumer and access tokens/keys [(link)](https://apps.twitter.com/).
  You will also need to grant write permission to your application.
- Extract your twitter data and copy `data/tweet.js` into the scripts
  working directory
- Copy the sample `.env` file `cp .env.sample .env`
- Edit the `.env` file and replace the placeholders with your twitter
  app tokens/keys obtained earlier

  ```
  TWITTER_CONSUMER_KEY=**your key**
  TWITTER_CONSUMER_SECRET=**your secret**
  TWITTER_ACCESS_TOKEN_KEY=**your token key**
  TWITTER_ACCESS_TOKEN_SECRET=**your token secret**
  ```

- Execute the script (below will delete 100 tweets before 2011-01-01)
  - `node index.js -d 2011-01-01`
    - `-d` - cutoff date in yyyy-mm-dd format
    - `-n` - number of tweets to delete (optional, default to 100)
- IDs of deleted tweets will be written to `deleted.js`
- Rerun the script to continue the next batch of tweets

To see all of the scripts options, please run `node index.js -h`

## Contributors

Originally authored by [@hbish](http://github.com/hbish)

Special thanks to
[Twitter for Node.js](https://www.npmjs.com/package/twitter) for the
awesome twitter client.
