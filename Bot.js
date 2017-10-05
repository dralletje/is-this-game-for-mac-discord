const require_not_found = Symbol(`Required file not found`);
const optional_require = (name) => {
  try {
    return require(name);
  } catch (e) {
    return require_not_found;
  }
}

const Discord = require("discord.js");
const fetch = require('node-fetch');

const config = optional_require('./config.js');

if (config === require_not_found) {
  console.warn(`No config file found! :O (Duplicate 'config.example.js' to 'config.js')`);
  process.exit();
}

const client = new Discord.Client();

client.on("ready", () => {
  console.log("> De bot is aan het lopen");
  console.log(`> Ga naar https://discordapp.com/oauth2/authorize?client_id=${config.client_id}&scope=bot&permissions=0`)
});

// client.on("messageReactionAdd", (reaction, user) => {
//     console.log(reaction);
// });

client.on("message", async (message) => {
  const emoji = (name) => {
    if (message.guild) {
      if (message.guild) {
        return message.guild.emojis.find("name", name);
      } else {
        return null;
      }
    }
  }

  // console.log('message.author:', message.author);

  if (message.content === 'asdf') {
    const embed = new Discord.RichEmbed({
      author: {
        name: 'My Man',
        icon: 'https://cdn.discordapp.com/icons/240902201868812289/e29e7691ba3b2983b1346baf84e612f0.png',
        url: 'https://dral.eu',
      },
      url: 'https://dral.eu',
      title: 'Title',
      color: 0,
      description: 'Description....',
      footer: {
        text: 'Footer...',
        icon: 'https://i.pinimg.com/originals/22/93/9c/22939cccb4ae5640388b6f7017a4744b.jpg',
      },
      image: {
        url: 'https://images.fineartamerica.com/images-medium-large-5/new-york-city-nyc-skyline-midtown-manhattan-at-night-black-and-white-jon-holiday.jpg',
      },
      thumbnail: {
        url: 'http://debatgroep.nl/CHRIS_IS_GEWELDIG.png',
      }
    });
    message.channel.send("Hey", embed);
  }


  const steam_search_match = message.content.match(/^steam:? (.*)$/i);
  if (steam_search_match) {
    const search = steam_search_match[1].replace(/[^a-zA-Z0-9]/g, '+');
    const resp = await fetch(`http://store.steampowered.com/search/suggest?term=${search}&f=games&no_violence=0&no_sex=0`);
    const html = await resp.text();

    const appid_match = html.match(/data-ds-appid="(\d+)"/);

    if (appid_match) {
      const appid = appid_match[1];
      // const url_match = html.match(/href="http://store.steampowered.com/app/674940/Stick_Fight_The_Game/?snr=1_7_15__13"/)
      message.reply(`http://store.steampowered.com/app/${appid}`);
    } else {
      const feelsbadman_emoji = emoji('feelsbadman');
      message.react(feelsbadman_emoji || '🤷');
    }
  }

  const steam_url_match = message.content.match(/http:\/\/store.steampowered.com\/app\/(\d+)/i);
  if (steam_url_match) {
    const appid = steam_url_match[1];
    const resp = await fetch(`http://store.steampowered.com/api/appdetails/?appids=${appid}`);
    const data = await resp.json();

    const game = data[appid].data;

    if (game.platforms.mac === false) {
      const notformac_emoji = emoji('notformac');

      if (notformac_emoji) {
        message.react(notformac_emoji);
      } else {
        message.channel.send(`gvd, "${game.name}" is niet voor mac`);
      }
    }
  }
});

client.login(config.token);
