import { parse } from "shell-quote";
import Process from "../process";
import { resolveRelativePath } from "../process";
import PATH from "./PATH";
import { fs } from 'memfs';
import { FileFlag } from "browserfs/dist/node/core/file_flag";

function hasGoodQuotes(s: string) {
    let q = '';
    let escape = false;
    for (const ch of s) {
        if (escape) {
            escape = false;
            continue
        }
        if (ch == '\\') {
            escape = true;
            continue
        }

        if (['`', "'", `"`].includes(ch)) {
            if (!q) q = ch;
            else if (q == ch) q = '';
        }
    }
    return q==''
}

export default class Bash extends Process {
    override async main() {
        while (true) {
            this.print(`guest@${window.location.host || "VirtualTerminal"} ${this.cwd} $ `);
            let line = '';
            do {
                if(line) this.print('> ')
                line += await this.readLine()+'\n';
            } while (line.endsWith('\\\n') || !hasGoodQuotes(line));
            line = line.replace('\\\n', '')
            const parsed = parse(line)
            console.log(parsed)
            let command: string[] = [];
            let redirect: undefined | true | string, valid = true;
            for (const word of parsed) {
                if (typeof word == 'object' && 'comment' in word) continue;
                if (redirect === true) {
                    if (typeof word == 'string') redirect = word;
                    else {
                        this.println("bash: syntax error near unexpected token '>'");
                        valid = false;
                        break;
                    }
                }
                else if (typeof word == 'object' && 'op' in word) {
                    if (word.op === '>') redirect = true;
                    else {
                        this.println("bash: unsupported token");
                        valid = false;
                        break;
                    }
                }
                else if (typeof word == 'string') {
                    command.push(word);
                }
                else {
                    this.println("bash: unsupported token");
                    valid = false;
                    break;
                }
            }
            if (redirect === true) continue;
            if (!valid) continue;
            switch (command[0]) {
                case '':
                    break;

                case 'exit':
                    return;

                case 'cd':
                    if (command[1]) {
                        let to = resolveRelativePath(command[1], this.cwd);
                        if (!to.endsWith('/')) to += '/';
                        try {
                            await fs.promises.readdir(to);
                            this.cwd = to;
                        } catch (e) {
                            if (e instanceof Error) this.println(e.message);
                            else throw e;
                        }
                    } else {
                        this.println(this.cwd);
                    }
                    this.println();
                    break;

                default: {
                    let executable = PATH[command[0]]?.();
                    let removeFirstArg = true;
                    if (!executable) {
                        if (await this.fs.exists(resolveRelativePath(command[0], this.cwd))) {
                            executable = PATH['node']!();
                            removeFirstArg = false;
                        }
                        else {
                            this.println(`${command[0]}: command not found`);
                            break;
                        }
                    }
                    if(removeFirstArg) command= command.slice(1)
                    if (redirect) {
                        let output=''
                        await this.runSubprocessAndMapInputs(new executable(this.fs, ...command), '.', data => output += data);
                        await this.fs.writeFile(resolveRelativePath(redirect, this.cwd), output, 'utf-8', FileFlag.getFileFlag('w'),0o555)
                    }
                    else
                        await this.runSubprocessAndMapInputs(new executable(this.fs, ...command), '.');
                    break;
                }
            }
        }
    }
}