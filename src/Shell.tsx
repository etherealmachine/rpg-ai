import React from 'react';
import './App.css';

import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import TerminalCodes from './TerminalCodes';

import 'xterm/css/xterm.css'

export interface Writer {
  write(buf: string): void;
}

export interface Executable {
  startup(): string;
  prompt(): string;
  execute(commandLine: string, stdout: Writer, stderr: Writer): Promise<number>;
  suggestions(commandLine: string): string[];
  recv(buf: string): void;
}

interface ShellProps {
  program: Executable;
}

interface ShellState {
  running?: Executable;
  commandBuffer: string;
  tmpBuffer: string;
  cursor: number;
  historyIndex: number;
  history: string[];
  suggestions: string[];
}

class Shell extends React.Component<ShellProps, ShellState> {

  term: XTerm;
  fitAddon: FitAddon;
  termEl: HTMLElement | null | undefined;

  constructor(props: any) {
    super(props);
    this.term = new XTerm();
    this.fitAddon = new FitAddon();
    this.state = {
      commandBuffer: "",
      tmpBuffer: "",
      cursor: 0,
      historyIndex: 0,
      history: [],
      suggestions: [],
    };
  }

  componentDidMount() {
    if (this.termEl === null || this.termEl === undefined) {
      return;
    }
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.termEl);
    this.term.onData(this.handleData.bind(this));
    this.fitAddon.fit();
    this.write(this.props.program.startup());
    this.write('\r\n');
    this.displayPrompt();
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
      const suggestions = this.props.program.suggestions(this.state.commandBuffer);
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
      this.setState({
        ...this.state,
        running: undefined,
      });
    } else {
      this.addCharacter(data);
    }
    if (!this.state.running) {
      this.displayPrompt();
    }
  }

  write(buf: string) {
    this.term.write(buf);
  }

  displayPrompt() {
    this.term.write(TerminalCodes.SetColumn(0));
    this.term.write(this.props.program.prompt());
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

  async runCommand() {
    const { program } = this.props;
    const { commandBuffer, history } = this.state;
    if (this.state.running) {
      this.state.running.recv(commandBuffer);
      return;
    }
    this.term.write(TerminalCodes.ClearScreen(0));
    this.term.write('\r\n');
    if (commandBuffer === 'history') {
      this.write(this.state.history.join('\r\n'));
    } else if (commandBuffer === 'clear') {
      this.term.write(TerminalCodes.SetPosition(1, 1));
      this.term.write(TerminalCodes.ClearScreen(2));
    } else {
      this.setState({
        ...this.state,
        running: program,
      });
      await program.execute(commandBuffer, this, this);
      if (commandBuffer !== history[history.length - 1]) {
        history.push(commandBuffer);
      }
    }
    this.setState({
      ...this.state,
      running: undefined,
      commandBuffer: "",
      historyIndex: history.length,
      history: history,
      cursor: 0,
      suggestions: [],
    });
    this.displayPrompt();
  }

  render() {
    return (
      <div ref={el => this.termEl = el} />
    );
  }
}

export default Shell;