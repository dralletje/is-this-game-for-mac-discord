// @flow

/*

*/

const is_react_discord = Symbol();

const precondition = (condition, message = `Precondition not met`) => {
  if (!condition) {
    throw new Error(message);
  }
}

type T_component =
  | Component
  | (props: any) => T_renderable

type T_instance =
  | { type: 'empty_instance' }
  // | { type: 'container', items: Array<T_instance> } TODO Arrays

type T_renderable =
  | null
  | Array<T_renderable>
  | { [is_react_discord]: true, type: T_component, props: any }

type T_change =
  | { type: 'clear' }

const EMPTY_INSTANCE = { type: 'empty_instance' };
const both_or_neither = (x, y) => (!x && !y) || (x && y);

const get_instance_changes = (instance: T_instance, renderable: T_renderable) => {
  // TODO Arrays
  // precondition(
  //   both_or_neither(Array.isArray(renderable), instance.type === 'container'),
  //   `Please don't switch between elements and arrays just yet`,
  // );

  if (renderable == null) {
    if (instance.type === 'empty_instance') {
      return [];
    } else {
      return [{ type: 'clear' }];
    }
  }

  if (Array.isArray(renderable) && instance.type === 'container') {
    // TODO Diff the arrays with keys
    throw new Error(`Not done with arrays just yet sorry`);
    // return {
    //   type: 'container',
    //   items: children.map(x => mount(children)),
    // };
  }

  if (renderable[is_react_discord] === true) {
    const { type, props } = renderable;

    precondition(type != null, `Type is not set (${type})`);
    precondition(typeof type === 'function', `Component has to be class or function`);

    if (type.prototype instanceof Component) {
      let instance = new type(props);
      let rendered_children = instance.render(props);
      let idk_what_this_should_return = instance.componentDidMount();

      try {
        let render_result = mount(rendered_children);
        return { type: 'instance', instance: instance, result: render_result };
      } catch (e) {
        if (instance.componentDidCatch) {
          // TODO Unmount everything under this thing
          instance.componentDidCatch(e);
          return { type: 'instance', instance: instance, result: { type: 'crashed_component' } };
        } else {
          throw e;
        }
      }

      return { type: 'instance', instance: instance, result: render_result };
    } else {
      const rendered_children = type(props);
      let render_result = mount(rendered_children);
      return {
        type: 'function',
        component: type,
        result: render_result,
      };
    }
  }

  console.log('children:', children)
  throw new Error(`Type unknown`);
}

const capitalize = (str) => str.length === 0 ? str : str[0].toUpperCase() + str.slice(1);
class Component<Props: {}, State> {
  child_instance: T_instance;
  props: Props;
  state: ?State;

  constructor(props: Props) {
    this.props = props;
    this.child_instance = EMPTY_INSTANCE;
    this.state = null;
  }

  mount() {
    const root_element = this.render();


    if (this.child_instance.type === 'empty_instance') {
      this.child_instance =
    }
    console.log('shallow_child:', shallow_child);
  }

  setState(update: $Shape<State>) {
    if (this.state == null) {
      throw new Error(`Updating state while it was null!`);
    }
    this.state = {
      ...this.state,
      ...update,
    };

    const render_result = this.render();
  }

  run_async(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (e) {
        console.warn(`Error while running event:`);
        console.warn(e.stack);
      }
    }
  }

  async emit(eventName: string, argument: any = {}) {
    const key = `on${capitalize(eventName)}`
    if (this.props && this.props[key]) {
      precondition(typeof this.props[key] === 'function', `Event props ${key} has to be a function`);
      const result = await this.props[key](argument);
      const mounted = await mount_event(result);
      return get_events_from({ tree: mounted });
    }
  }

  componentDidMount() {
    return null;
  }
  render() {
    return null;
  }
}

const EventComponent = Symbol(`Event Component`);

const mount_event = (children) => {
  if (children == null) {
    return { type: 'empty_instance?' };
  }
  if (Array.isArray(children)) {
    return {
      type: 'container',
      items: children.map(x => mount_event(children)),
    };
  }
  if (children[is_react_discord] === true) {
    const { type, props } = children;

    if (type === EventComponent) {
      return { type: 'event', child: children };
    } else if (typeof type === 'function') {
      let render_result = type(props);
      let children_instances = mount_event(render_result);
      return { type: 'render', type: type, result: children_instances }
    } else {
      precondition(type, `Type is not set (${type})`);
      precondition(type.prototype instanceof Component, `Now only accepting Component classes`);

      let instance = new type(props);
      let render_result = instance.render(props);

      let idk_what_this_should_return = instance.componentDidMount();
      // let idk_what_this_should_return = instance.emit('mount');
      let children_instances = mount_event(rendered_children);

      return { type: 'instance', instance: instance, component: type, result: children_instances };
    }
  }

  console.log('children:', children)
  throw new Error(`Type unknown`);
}

const get_events_from = ({ tree }) => {
  if (tree.type === 'event') {
    return [tree.child.props];
  }
  if (tree.type === 'container') {
    return flatten(tree.items.map(x => get_events_from({ tree: x })))
  }
  if (tree.result) {
    return get_events_from({ tree: tree.result });
  }
  return [];
}

const React = {
  createElement: (type, props, children) => {
    if (children != null) {
      if (props != null) {
        props.children = children;
      } else {
        props = { children };
      }
    }
    return {
      [is_react_discord]: true,
      type: type,
      props: props,
    }
  },
  mount: mount,
  mount_event: mount_event,
  EventComponent: EventComponent,
  Component: Component,
}

export default React;
