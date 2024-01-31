# Scrimmage - Discord integration bot

## Description

This repository contains the source code for the Scrimmage Discord bot.
Scrimmage - Discord bot that allows you to convert events from you Discord 
server into Scrimmage events. It is built using NestJS and Discord.js.

## Deployment

### Docker

The easiest way to run the bot is to use Docker. We provide ready to use
images. To run the bot using Docker, you need to have Docker installed.

Run the bot using the following command:

```bash
docker run \
 -e DISCORD_TOKEN=<your_discord_token> \
 -e SCRIMMAGE_API_SERVER_ENDPOINT=<your_scrimmage_api_server_endpoint> \
 -e SCRIMMAGE_PRIVATE_KEY=<your_scrimmage_private_key> \
 -e SCRIMMAGE_NAMESPACE=<your_scrimmage_namespace> \
 -p 3000:3000 \
 public.ecr.aws/u8g2k1e9/scrimmage-discord-event-integration:latest
```

All listed environment variables are required. You can find more information
about them in the [Configuration](#configuration) section.

### Custom

You can also run the bot without Docker. To do so, you need to have Node.js
installed. You can find more information about installing Node.js
[here](https://nodejs.org/en/download/).

To run the bot, you need to install dependencies first:

```bash
npm install
```

Then, you can build the bot:

```bash
npm run build
```

Finally, you can run the bot:

```bash
node dist/main.js
```

## Discord bot token

To run the bot, you need to have a Discord bot token. You can find more
information about Discord bot tokens
[here](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot).

After you have created a Discord bot, you need to add it to your Discord
server. You can find more information about adding a Discord bot to your
server [here](https://discordjs.guide/preparations/adding-your-bot-to-servers.html).

We recommend using the following permissions for the bot:

- Administrator (for now, we will reduce the required permissions in the future)

## Configuration

The bot can be configured using environment variables. The following
environment variables are available:

| Name                            | Description                                            | Required |
|---------------------------------|--------------------------------------------------------|----------|
| `DISCORD_TOKEN`                 | Discord bot token (see [here](#discord-bot-token))     | Yes      |
| `DISCORD_ALLOWED_GUILD_IDS`     | Comma-separated list of allowed Discord guild IDs      | No       |
| `DISCORD_ALLOWED_CHANNEL_IDS`   | Comma-separated list of allowed Discord channel IDs    | No       |
| `SCRIMMAGE_API_SERVER_ENDPOINT` | Scrimmage API server endpoint                          | Yes      |
| `SCRIMMAGE_PRIVATE_KEY`         | Scrimmage private key                                  | Yes      |
| `SCRIMMAGE_NAMESPACE`           | Scrimmage namespace                                    | Yes      |
| `SCRIMMAGE_DATA_TYPE_PREFIX`    | Scrimmage data type prefix                             | No       |
| `PORT`                          | Port on which the bot will listen (default: `3000`)    | No       |
| `HOSTNAME`                      | Host on which the bot will listen (default: `0.0.0.0`) | No       |


## Development

### Dependencies

To install dependencies, run the following command:

```bash
$ npm install
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Stay in touch

- Author - [Scrimmage Team](founders@scrimmage.co)
- Website - [https://scrimmage.co](https://scrimmage.co/)
