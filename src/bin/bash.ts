import { parse } from "shell-quote";
import Process from "../process";
import { resolveRelativePath } from "../process";
import PATH from "./PATH";
import { findAsync } from "../util";

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
            const parsed = parse(line, this.env)
            console.log(parsed)
            let command: string[] = [];
            let env: typeof this.env = {}
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
                    if(word.includes('=')) {
                        const [key, value] = word.split('=');
                        env[key] = value;
                    }
                    else command.push(word);
                }
                else {
                    this.println("bash: unsupported token");
                    valid = false;
                    break;
                }
            }
            if (redirect === true) continue;
            if (!valid) continue;
            if (!command.length) {
                this.env = {...this.env, ...env}
                continue;
            };
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
                            await this.fs.promises.readdir(to);
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
                        if(command[0].includes('/')){
                            if (await this.fs.promises.exists(resolveRelativePath(command[0], this.cwd))) {
                                executable = PATH['node']!();
                                removeFirstArg = false;
                            }
                            else {
                                this.println(`${command[0]}: command not found`);
                                break;
                            }
                        } else {
                            const path = (this.env.PATH || '').split(':').filter(Boolean);
                            const firstValidDir = await findAsync(path, dir=> this.fs.promises.exists(dir+'/'+command[0]));
                            if(!firstValidDir) {
                                this.println(`${command[0]}: command not found`);
                                break;
                            }
                            command[0] = firstValidDir+'/'+command[0]
                            executable = PATH['node']!();
                            removeFirstArg = false;
                        }
                    }
                    if(removeFirstArg) command= command.slice(1)
                    if (redirect) {
                        let output=''
                        await this.runSubprocessAndMapInputs(new executable(this.fs, ...command), '.', env, data => output += data);
                        await this.fs.promises.writeFile(resolveRelativePath(redirect, this.cwd), output, 'utf-8');
                    }
                    else
                        await this.runSubprocessAndMapInputs(new executable(this.fs, ...command), '.', env);
                    break;
                }
            }
        }
    }
}