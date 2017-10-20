const require_not_found = Symbol(`Required file not found`);
const optional_require = name => {
  try {
    return require(name);
  } catch (e) {
    return require_not_found;
  }
};

const fetch = require('node-fetch');
const { mapValues, flatten } = require('lodash');

const config = optional_require('./config.js');

if (config === require_not_found) {
  console.warn(
    `No config file found! :O (Duplicate 'config.example.js' to 'config.js')`,
  );
  process.exit();
}

import React from './Ultimate_React_Clone';
import Discord from './Discord';

const precondition = (condition, message = `Precondition not met`) => {
  if (!condition) {
    throw new Error(message);
  }
};

const RichEmbed = ({ to }) => {
  return (
    <Discord.Message
      to={to}
      text=""
      embed={{
        author: {
          name: 'My Man',
          icon_url:
            'https://cdn.discordapp.com/icons/240902201868812289/e29e7691ba3b2983b1346baf84e612f0.png',
          url: 'https://dral.eu',
        },
        url: 'https://dral.eu',
        title: 'Title',
        color: 0,
        description: 'Description....',
        footer: {
          text: 'Footer...',
          icon_url:
            'https://i.pinimg.com/originals/22/93/9c/22939cccb4ae5640388b6f7017a4744b.jpg',
        },
        image: {
          url:
            'https://images.fineartamerica.com/images-medium-large-5/new-york-city-nyc-skyline-midtown-manhattan-at-night-black-and-white-jon-holiday.jpg',
        },
        thumbnail: {
          url: 'http://debatgroep.nl/CHRIS_IS_GEWELDIG.png',
        },
        fields: [
          {
            name: 'Fields',
            value: 'They can have different fields with small headlines.',
          },
          {
            name: 'Masked links',
            value:
              'You can put [masked links](http://google.com) inside of rich embeds.',
          },
          {
            name: 'Markdown',
            value:
              'You can put all the *usual* **__Markdown__** inside of them.',
          },
        ],
      }}
    />
  );
};

const Wrap = ({ children }) => {
  return children;
}

class App extends React.Component {
  constructor(props) {
    super();
    this.state = {
      count: 0,
    }
  }

  componentDidCatch(err) {
    console.log('!!! err.stack:', err.stack);
  }

  render() {
    const { count } = this.state;

    console.log('Count:', count);

    return (
      <Wrap>
        <Discord.Client
          presence={{
            status: 'online',
            afk: false,
            game: { name: `:: ${count}` },
          }}
          token={config.token}
          onReady={() => {
            console.log('> De bot is aan het lopen');
            console.log(
              `> Ga naar https://discordapp.com/oauth2/authorize?client_id=${config.client_id}&scope=bot&permissions=0`,
            );
          }}
          onMessage={async message => {
            const emoji = name => {
              if (message.guild) {
                if (message.guild) {
                  return message.guild.emojis.find('name', name);
                } else {
                  return null;
                }
              }
            };

            // console.log('message.author:', message.author);

            if (message.content === 'asdf') {
              this.setState({ count: count + 1 })
              // return <RichEmbed to={message.channel} />;
              return;
            }

            const youtube_search_match = message.content.match(
              /^rachidtube:? (.*)$/i,
            );
            if (youtube_search_match) {
              const search = encodeURIComponent(youtube_search_match[1].trim());
              const youtube_url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${search}&type=video&key=${config.youtube}`;

              const resp = await fetch(youtube_url);
              const data = await resp.json();
              const item = data.items[0];

              if (item) {
                const id = item.id.videoId;
                return (
                  <Discord.Message
                    to={message.channel}
                    text={`rachid https://www.youtube.com/watch?v=${id}`}
                  />
                );
              }
            }

            // Figure out if someone says "steam xxx"
            const steam_search_match = message.content.match(/^steam:? (.*)$/i);
            if (steam_search_match) {
              // Turn "stickfight the game" into "stickfight+the+game"
              const search = steam_search_match[1].replace(/[^a-zA-Z0-9]/g, '+');
              // Fetch the search query from the unofficial search api
              const resp = await fetch(
                `http://store.steampowered.com/search/suggest?term=${search}&f=games&no_violence=0&no_sex=0`,
              );
              const html = await resp.text();

              const appid_match = html.match(/data-ds-appid="(\d+)"/);

              if (appid_match) {
                const appid = appid_match[1];
                return (
                  <Discord.Message
                    to={message.channel}
                    text={`http://store.steampowered.com/app/${appid}`}
                  />
                );
              } else {
                const feelsbadman_emoji = emoji('feelsbadman');
                return (
                  <Discord.Reaction
                    message={message}
                    emoji={feelsbadman_emoji || '🤷'}
                  />
                );
              }
            }

            const steam_url_match = message.content.match(
              /http:\/\/store.steampowered.com\/app\/(\d+)/i,
            );
            if (steam_url_match) {
              const appid = steam_url_match[1];
              const resp = await fetch(
                `http://store.steampowered.com/api/appdetails/?appids=${appid}`,
              );
              const data = await resp.json();

              const game = data[appid].data;

              if (game.platforms.mac === false) {
                const notformac_emoji = emoji('notformac');

                if (notformac_emoji) {
                  return (
                    <Discord.Reaction message={message} emoji={notformac_emoji} />
                  );
                } else {
                  return (
                    <Discord.message
                      to={message.channel}
                      text={`gvd, "${game.name}" is niet voor mac`}
                    />
                  );
                }
              } else {
                return <Discord.Reaction message={message} emoji={'🍎'} />;
              }
            }
          }}
        />
      </Wrap>
    );
  }
}

const instance = React.mount(<App />);
console.log('instance:', instance);
