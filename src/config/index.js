const path = require("path");
const dotenv = require('dotenv');

const dbConfig = require(path.join(__dirname, 'config'));
const text = require(path.join(__dirname, 'language'));
const bot = require(path.join(__dirname, 'bot'));

// Determine the current environment, defaulting to 'default'
const env = process.env.NODE_ENV || 'default';

// Load environment variables from .env file
dotenv.config({
  path: '.env',
});

/**
 * General configuration object that aggregates database and Telegram bot configurations
 * for different environments (default, development, test, production).
 * @type {Object}
 */
const generalConfig = {
  db: {
    default: dbConfig.default,
    development: dbConfig.development,
    test: dbConfig.test,
    production: dbConfig.production
  },
  telegram: {
    default: bot.default,
    development: bot.development,
    test: bot.test,
    production: bot.production
  },
  text: text
};

/**
 * Final configuration object selected based on the current environment.
 * It contains specific configurations for the database and the Telegram bot.
 * @type {Object}
 */
const config = {
  db: generalConfig.db[env],
  telegram: generalConfig.telegram[env],
};

console.log(config);

module.exports = config;
