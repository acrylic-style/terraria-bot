require('./src/yaml')
const initTime = Date.now()
const Discord = require('discord.js')
const { LoggerFactory } = require('logger.js')
const logger = LoggerFactory.getLogger('client', 'cyan')
logger.info('Initializing')
const dispatcher = require('bot-framework/dispatcher')
const language = require('./src/language')
const args = require('minimist')(process.argv.slice(2))
const emojis = require('emojilib/emojis')
const client = new Discord.Client()
const config = require('./config.yml')
const prefix = args['prefix'] || config['prefix']
const { f } = require('string-format')

client.on('reconnecting', () => {
  logger.warn('Disconnected from WebSocket, reconnecting!')
})

client.on('resume', retried => {
  logger.warn(`Reconnected. (${retried} times)`)
})

client.on('ready', async () => {
  client.user.setActivity(`${prefix}help | ${client.guilds.size} servers`)
  logger.info(`Terraria Bot is ready! (${client.readyAt.getTime()-initTime}ms)`)
})

client.on('message', async msg => {
  if (msg.author.bot || msg.system || !config['allowedUsers'].includes(msg.author.id)) return
  const lang = language.get(config['language'])
  if ((msg.content === `<@${msg.client.user.id}>` || msg.content === `<@!${msg.client.user.id}>`) && msg.attachments.size === 0)
    return msg.channel.send(f(lang.prefixis, prefix))
  if (msg.content.startsWith(prefix)) {
    logger.info(`${msg.author.tag} sent bot command: ${msg.content}`)
    dispatcher(msg, lang, prefix, config.owners, prefix).catch(e => {
      logger.error(e.stack || e)
      msg.react(emojis['x']['char'])
    })
  }
})

client.on('guildCreate', guild => {
  logger.info(`Discovered new guild: ${guild.name}(${guild.id})`)
  client.user.setActivity(`${prefix} | ${client.guilds.size} servers`)
})

client.on('guildDelete', guild => {
  logger.info(`Disappeared guild: ${guild.name}(${guild.id})`)
  client.user.setActivity(`${prefix} | ${client.guilds.size} servers`)
  // todo: stop all servers that active in this server
})

logger.info('Logging in...')
client.login(config['token'])


process.on('SIGINT', async () => {
  await client.destroy()
  logger.info('Successfully disconnected from Discord.')
  process.exit()
})

module.exports = client
