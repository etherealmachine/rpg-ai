import React from 'react';

import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import TerminalCodes from './TerminalCodes';

import 'xterm/css/xterm.css'

export interface Writer {
  write(buf: string): void;
}

export interface Reader {
  read(): Promise<string>;
}

export interface Executable {
  startup(): string;
  prompt?(): string | undefined;
  execute(commandLine: string, stdin: Reader, stdout: Writer, stderr: Writer): Promise<number>;
  cancel(): void;
  suggestions(commandLine: string): string[];
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

const DEFAULT_PROMPT = `${TerminalCodes.Red}${TerminalCodes.Bold}rpg.ai > ${TerminalCodes.Reset}`;

class Shell extends React.Component<ShellProps, ShellState> {

  term: XTerm;
  fitAddon: FitAddon;
  termEl: HTMLElement | null | undefined;
  reader?: (buf: string) => void;

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
      cursor: this.state.history[newIndex].length,
    })
  }

  down() {
    const { historyIndex, tmpBuffer } = this.state;
    if (historyIndex + 1 >= this.state.history.length) {
      this.setState({
        ...this.state,
        historyIndex: this.state.history.length,
        commandBuffer: tmpBuffer,
        cursor: tmpBuffer.length,
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
    });
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
      if (this.reader) {
        this.reader(this.state.commandBuffer);
        this.reader = undefined;
        this.setState({
          ...this.state,
          cursor: 0,
          commandBuffer: "",
          tmpBuffer: "",
        });
      } else {
        this.runCommand();
      }
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
    } else if (c === 3 && this.state.running) { // CTRL-C
      this.state.running.cancel();
      this.setState({
        ...this.state,
        running: undefined,
      });
    } else {
      this.addCharacter(data);
      if (this.state.running) {
        this.write(data);
      }
    }
    if (!this.state.running) {
      this.displayPrompt();
    }
  }

  write(buf: string) {
    this.term.write(buf);
  }

  read(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.reader = resolve;
    });
  }

  displayPrompt() {
    this.term.write(TerminalCodes.SetColumn(0));
    const prompt = this.props.program.prompt?.call(this.props.program);
    if (prompt) {
      this.term.write(prompt);
    } else {
      this.term.write(DEFAULT_PROMPT);
    }
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
        commandBuffer: "",
        tmpBuffer: "",
        cursor: 0,
        suggestions: [],
      });
      await program.execute(commandBuffer, this, this, this);
      if (commandBuffer !== history[history.length - 1]) {
        history.push(commandBuffer);
      }
    }
    this.setState({
      ...this.state,
      running: undefined,
      commandBuffer: "",
      tmpBuffer: "",
      cursor: 0,
      historyIndex: history.length,
      history: history,
    });
    this.displayPrompt();
  }

  render() {
    return (
      <div
        style={{
          height: '100%',
          minHeight: '400px',
        }}
        ref={el => this.termEl = el}
      />
    );
  }
}

export default Shell;