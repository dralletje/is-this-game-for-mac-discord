const require_not_found = Symbol(`Required file not found`);
const optional_require = (name) => {
  try {
    return require(name);
  } catch (e) {
    return require_not_found;
  }
}

const fetch = require('node-fetch');
const { mapValues } = require('lodash');

const config = optional_require('./config.js');

if (config === require_not_found) {
  console.warn(`No config file found! :O (Duplicate 'config.example.js' to 'config.js')`);
  process.exit();
}

// client.on("messageReactionAdd", (reaction, user) => {
//     console.log(reaction);
// });

const precondition = (condition, message = `Precondition not met`) => {
  if (!condition) {
    throw new Error(message);
  }
}

const is_react_discord = Symbol();
const is_react_discord_driver = Symbol();
const React = {
  createElement: (type, props, children) => {
    if (children != null) {
      props.children = children;
    }
    return {
      [is_react_discord]: true,
      type: type,
      props: props,
    }
  },
}

const capitalize = (str) => str.length === 0 ? str : str[0].toUpperCase() + str.slice(1);
class Component {
  constructor(props) {
    this.props = props;
  }

  emit(eventName, argument = {}) {
    const key = `on${capitalize(eventName)}`
    if (this.props && this.props[key]) {
      precondition(typeof this.props[key] === 'function', `Event props ${key} has to be a function`);
      const result = this.props[key](argument);
      return result;
    }
  }

  componentDidMount() {
    return null;
  }
  render() {
    return null;
  }
}

const EventComponent = Symbol(`Event COmponent`);

const mount = (children) => {
  if (children == null) {
    return { type: 'empty_instance?' };
  }
  if (Array.isArray(children)) {
    return {
      type: 'container',
      items: children.map(x => render(children)),
    };
  }
  if (typeof children === 'symbol') {
    return { type: 'event' }; // TODO Dunno yet
  }
  // if (children[is_react_discord_driver] === true) {
  //   return {
  //
  //   }
  // }
  if (children[is_react_discord] === true) {
    const { type, props } = children;

    precondition(type, `Type is not set (${type})`);
    precondition(type.prototype instanceof Component, `Now only accepting Component classes`);

    let instance = new type(props);
    let rendered_children = instance.render(props);

    let idk_what_this_should_return = instance.componentDidMount();
    // let idk_what_this_should_return = instance.emit('mount');
    let render_result = mount(rendered_children);

    return { type: 'instance', instance: instance, result: render_result };
  }

  console.log('children:', children)
  throw new Error(`Type unknown`);
};

const DiscordApi = require("discord.js");
const DiscordSymbol = Symbol();
const Discord = {
  Client: class Client extends Component {
    componentDidMount() {
      this.client = new DiscordApi.Client();

      this.client.on('ready', async () => {
        const result = await this.emit('ready');
        console.log('ready result:', result);

        // if (result && result.type === Discord.Message) {
        //
        // }
      });

      this.client.on("message", async (message) => {
        const result = await this.emit('message', message);
        console.log('message result:', result);

        if (result && result[is_react_discord] === true) {
          const { type, props } = result;
          // console.log('props:', props);

          if (type === Discord.Message) {
            props.to.send(props.text, props.embed);
            return;
          }
          if (type === Discord.Reaction) {
            props.message.react(props.emoji);
            return;
          }
        }
      });

      this.client.login(this.props.token);
    }
  },

  Message({ to, text, embed }) {
    return (
      <EventComponent
        for={DiscordSymbol}
        type="Message"
        data={{ to, text, embed }}
      />
    )
  },

  Reaction({ message, emoji }) {
    return (
      <EventComponent
        for={DiscordSymbol}
        type="Reaction"
        data={{ message, emoji }}
      />
    )
  }
}

const RichEmbed = () => {
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
  return (
    <Discord.Message
      to={message.channel}
      text={"Hey"}
      embed={embed}
    />
  )
}

class App extends Component {
  render() {
    return (
      <Discord.Client
        token={config.token}
        onReady={() => {
          console.log("> De bot is aan het lopen");
          console.log(`> Ga naar https://discordapp.com/oauth2/authorize?client_id=${config.client_id}&scope=bot&permissions=0`)
        }}
        onMessage={async (message) => {
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
            return <RichEmbed />
          }

          const youtube_search_match = message.content.match(/^rachidtube:? (.*)$/i);
          if  (youtube_search_match) {
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
              )
            }
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
              )
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
                return (
                  <Discord.Reaction
                    message={message}
                    emoji={notformac_emoji}
                  />
                )
              } else {
                return (
                  <Discord.message
                    to={message.channel}
                    text={`gvd, "${game.name}" is niet voor mac`}
                  />
                )
              }
            } else {
              return (
                <Discord.Reaction
                  message={message}
                  emoji={'🍎'}
                />
              )
            }
          }
        }}
      >

      </Discord.Client>
    );
  }
}

const instance = mount(<App />);
console.log('instance:', instance);
