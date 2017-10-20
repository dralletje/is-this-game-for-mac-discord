import React from './Ultimate_React_Clone';
import { uniq } from 'lodash';

const DiscordApi = require("discord.js");
const DiscordSymbol = Symbol(`Discord Event Symbol`);

const get_changes = ({ prev, next }) => {
  let removed = new Map(prev);
  let changed = new Map();
  let added = new Map(next);

  const all_keys = uniq([...Object.keys(prev), ...Object.keys(next)]);
  const changes = all_keys
  .map(key => {
    return {
      key: key,
      prev: prev[key],
      next: next[key],
    }
  })
  .filter(x => x.prev === x.next)

  return changes;
}

const Discord = {
  Client: class Client extends React.Component {
    props: {
      token: string,
      playing_game?: string,
    }

    componentDidMount() {
      this.client = new DiscordApi.Client();

      const handle_discord_events = (events) => {
        const my_events = events.filter(props => props.for === DiscordSymbol);
        return Promise.all(my_events.map(({ type, data }) => {
          if (type === 'Message') {
            data.to.send(data.text, data.embed);
            return;
          }
          if (type === 'Reaction') {
            data.message.react(data.emoji);
            return;
          }
        }))
        .then(x => {
          console.log('EVENTS result:', x);
        })
        .catch(err => {
          console.log('EVENTS err:', err);
        });
      }

      this.client.on('ready', this.run_async(async () => {
        await handle_discord_events(await this.emit('ready'));

        if (this.props.presence) {
          console.log('this.props.presence:', this.props.presence)
          this.client.user.setPresence(this.props.presence);
        }
      }));

      this.client.on("message", this.run_async(async (message) => {
        await handle_discord_events(await this.emit('message', message));
      }));

      this.client.login(this.props.token);
    }

    componentDidUpdate(prevProps) {
      const changes = get_changes(prevProps, this.props);

      changes
      // Events change automatically blablabla
      .filter(x => !/^on[A-Z]/.test(x.key))
      .forEach(x => {
        console.log('Discord client change:', x)
      })
    }
  },

  Message({ to, text, embed }) {
    return (
      <React.EventComponent
        for={DiscordSymbol}
        type="Message"
        data={{
          to,
          text,
          embed: embed && new DiscordApi.RichEmbed(embed),
        }}
      />
    );
  },

  Reaction({ message, emoji }) {
    return (
      <React.EventComponent
        for={DiscordSymbol}
        type="Reaction"
        data={{ message, emoji }}
      />
    );
  }
};

export default Discord;
