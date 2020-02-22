import React from 'react';
import './App.css';

import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import Session from './Session';
import Context from './Context';
import TerminalCodes from './TerminalCodes';

import 'xterm/css/xterm.css'

interface ShellProps {
  context: Context;
}

interface ShellState {
  initialized: boolean;
  commandBuffer: string;
  tmpBuffer: string;
  cursor: number;
  historyIndex: number;
  history: string[];
  suggestions: string[];
}

class Shell extends React.Component<ShellProps, ShellState> {

  runningCommand: boolean = false;
  session: Session = new Session();
  term: XTerm;
  fitAddon: FitAddon;
  termEl: HTMLElement | null | undefined;

  constructor(props: any) {
    super(props);
    this.term = new XTerm();
    this.fitAddon = new FitAddon();
    this.state = {
      initialized: false,
      commandBuffer: "",
      tmpBuffer: "",
      cursor: 0,
      historyIndex: 0,
      history: [],
      suggestions: [],
    };
    this.session.onEvent = this.handleSessionEvent.bind(this);
    this.session.onError = this.handleSessionError.bind(this);
    this.session.onConnect = this.handleSessionConnect.bind(this);
  }

  componentDidMount() {
    if (this.termEl === null || this.termEl === undefined) {
      return;
    }
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.termEl);
    this.term.onData(this.handleData.bind(this));
    this.fitAddon.fit();
    this.props.context.onChange((c: Context) => {
      if (!this.state.initialized) {
        this.setState({
          ...this.state,
          initialized: true,
        });
        this.term.write(this.props.context.welcomeMsg());
        this.displayPrompt();
      }
    });
  }

  up() {
    const { historyIndex, commandBuffer, tmpBuffer } = this.state;
    if (historyIndex - 1 < 0) {
      return;
    }
    const newIndex = historyIndex - 1;
    this.setState({
      ...this.state,
      historyIndex: newIndex,
      commandBuffer: this.state.history[newIndex],
      tmpBuffer: historyIndex === this.state.history.length ? commandBuffer : tmpBuffer,
      cursor: 0,
    })
  }

  down() {
    const { historyIndex, tmpBuffer } = this.state;
    if (historyIndex + 1 >= this.state.history.length) {
      this.setState({
        ...this.state,
        historyIndex: this.state.history.length,
        commandBuffer: tmpBuffer,
        cursor: 0,
      });
      return;
    }
    const newIndex = historyIndex + 1;
    this.setState({
      ...this.state,
      historyIndex: newIndex,
      commandBuffer: this.state.history[newIndex],
      cursor: 0,
    })
  }

  left() {
    const { cursor } = this.state;
    this.setState({
      ...this.state,
      cursor: Math.max(0, cursor - 1),
    })
  }

  right() {
    const { commandBuffer, cursor } = this.state;
    this.setState({
      ...this.state,
      cursor: Math.min(commandBuffer.length, cursor + 1),
    })
  }

  delete() {
    const { commandBuffer, cursor } = this.state;
    this.setState({
      ...this.state,
      cursor: Math.max(0, cursor - 1),
      commandBuffer: commandBuffer.substring(0, cursor - 1) + commandBuffer.substring(cursor, commandBuffer.length),
    })
  }

  addCharacter(data: string) {
    const { commandBuffer, cursor } = this.state;
    this.setState({
      ...this.state,
      cursor: this.state.cursor + 1,
      commandBuffer: commandBuffer.substring(0, cursor) + data + commandBuffer.substring(cursor, commandBuffer.length),
    })
  }

  handleData(data: string) {
    const c = data.charCodeAt(0);
    if (c === 27) { // ESC
      switch (data) {
        case TerminalCodes.Up():
          this.up();
          break;
        case TerminalCodes.Down():
          this.down();
          break;
        case TerminalCodes.Left():
          this.left();
          break;
        case TerminalCodes.Right():
          this.right();
          break;
      }
    } else if (c === 127) { // DEL
      this.delete();
    } else if (c === 13) { // CR
      this.runCommand();
    } else if (c === 9) { // TAB
      const suggestions = this.props.context.suggestions(this.state.commandBuffer);
      if (suggestions.length === 1) {
        this.setState({
          ...this.state,
          commandBuffer: suggestions[0],
        });
      } else {
        this.setState({
          ...this.state,
          suggestions: suggestions,
        });
      }
    } else if (c === 3) { // CTRL-C
      this.runningCommand = false;
    } else {
      this.addCharacter(data);
    }
    if (!this.runningCommand) {
      this.displayPrompt();
    }
  }

  handleSessionEvent(event: string) {
    this.write(event);
    this.write('\r\n');
  }

  handleSessionError(error: string) {
    this.write(TerminalCodes.Red);
    this.write(error);
    this.write(TerminalCodes.Reset);
    this.write('\r\n');
    this.runningCommand = false;
  }

  handleSessionConnect() {
    this.write(TerminalCodes.Green);
    this.write('connection established');
    this.write(TerminalCodes.Reset);
    this.write('\r\n');
    this.runningCommand = false;
  }

  write(buf: string) {
    this.term.write(buf);
  }

  displayPrompt() {
    this.term.write(TerminalCodes.SetColumn(0));
    this.term.write(this.props.context.prompt.prompt);
    this.term.write(TerminalCodes.ClearLine(0));
    this.term.write(this.state.commandBuffer);
    this.term.write(TerminalCodes.ClearScreen(0));
    if (this.state.suggestions.length > 0) {
      this.term.write('\r\n');
      this.state.suggestions
        .slice(0, Math.min(10, this.state.suggestions.length))
        .forEach((suggestion) => {
          this.term.write(suggestion);
          this.term.write('\r\n');
        });
      this.term.write(TerminalCodes.Up(Math.min(10, this.state.suggestions.length) + 1));
      this.term.write(TerminalCodes.SetColumn(8 + this.state.commandBuffer.length + 2));
    }
  }

  runCommand() {
    const { context } = this.props;
    const { commandBuffer, history } = this.state;
    this.term.write(TerminalCodes.ClearScreen(0));
    this.term.write('\r\n');
    if (commandBuffer === 'history') {
      this.write(this.state.history.join('\r\n'));
    } else if (commandBuffer === 'clear') {
      this.term.write(TerminalCodes.SetPosition(1, 1));
      this.term.write(TerminalCodes.ClearScreen(2));
    } else if (commandBuffer.startsWith('host ')) {
      const sessionCode = commandBuffer.split(' ')[1];
      this.session.connectSession(sessionCode, true);
      this.runningCommand = true;
    } else if (commandBuffer.startsWith('join ')) {
      const sessionCode = commandBuffer.split(' ')[1];
      this.session.connectSession(sessionCode, false);
      this.runningCommand = true;
    } else {
      context.execute(commandBuffer);
      if (context.prompt.output) {
        this.term.write(context.prompt.output);
        this.term.write('\r\n');
      }
      if (commandBuffer !== history[history.length - 1]) {
        history.push(commandBuffer);
      }
    }
    this.setState({
      ...this.state,
      commandBuffer: "",
      historyIndex: history.length,
      history: history,
      cursor: 0,
      suggestions: [],
    });
  }

  render() {
    return (
      <div ref={el => this.termEl = el} />
    );
  }
}

export default Shell;