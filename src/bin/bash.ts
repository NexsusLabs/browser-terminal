import { parse } from "shell-quote";
import Process from "../process";
import { resolveRelativePath } from "../process";
import PATH from "./PATH";
import { fs } from 'memfs';
import { FileFlag } from "browserfs/dist/node/core/file_flag";

export default class Bash extends Process {
    override async main() {
        while (true) {
            this.print(`guest@${window.location.host || "VirtualTerminal"} ${this.cwd} $ `);
            const input = parse(await this.readLine())
            let command: string[] = [];
            let redirect: undefined | true | string, valid = true;
            for (const word of input) {
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