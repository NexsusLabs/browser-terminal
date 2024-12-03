import Sandbox from "@nyariv/sandboxjs";
import Process, { resolveRelativePath } from "./process";
import { h32 } from "xxhashjs";

const sandbox = new Sandbox();
const cache: Record<number, ReturnType<typeof sandbox.compileAsync>> = {}

export class Node extends Process {
    async main(): Promise<number | void | undefined> {
        if (!this.args[0]) return; // no file to execute wtf

        const globals = {
            process: {
                args: this.args.slice(1),
                fs: this.fs,
                cwd: this.cwd,
                print: this.print.bind(this),
                println: this.println.bind(this),
                readKey: this.readKey.bind(this),
                readLine: this.readLine.bind(this),
                resolveRelativePath,
            }
        }

        // read file
        let file = await this.fs.promises.readFile(resolveRelativePath(this.args[0], this.cwd), 'utf-8');
        if (!file) return;
        if (typeof file !== 'string') return;

        // extract shebang
        const [firstLine, ...lines] = file.split('\n');
        const code = lines.join('\n');
        
        if (firstLine != "#!/usr/bin/node") {
            this.println("Invalid executable")
            return;
        }

        const hash = h32(code, 0).toNumber();
        if (!cache[hash]) {
            const ctx = sandbox.compileAsync(code);
            cache[hash] = ctx;
        }

        await cache[hash](globals).run()
    }
}