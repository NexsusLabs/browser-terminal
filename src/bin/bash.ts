import Process from "../process";
import { resolveRelativePath } from "../process";
import PATH from "./PATH";
import { fs } from 'memfs';

export default class Bash extends Process {
    override async main() {
        while (true) {
            this.print(`guest@${window.location.host || "VirtualTerminal"} ${this.cwd} $ `);
            const input = (await this.readLine()).split(' ');
            switch (input[0]) {
                case '':
                    break;
                
                case 'exit':
                    return;
                
                case 'cd':
                    if (input[1]) {
                        let to = resolveRelativePath(input[1], this.cwd);
                        if (!to.endsWith('/')) to += '/';
                        try {
                            await fs.promises.readdir(to);
                            this.cwd = to;
                        } catch(e) {
                            if (e instanceof Error) this.println(e.message);
                            else throw e;
                        }
                    } else {
                        this.println(this.cwd);
                    }
                    this.println();
                    break;

                default: {
                    const executable = PATH[input[0].toLowerCase()]?.();
                    if (executable) {
                        await this.runSubprocessAndMapInputs(new executable(this.fs, ...input.slice(1)));
                    }
                    else {
                        this.println(`bash: ${input[0]}: command not found`);
                        this.println();
                    }
                    break;
                }
            }
        }
    }
}