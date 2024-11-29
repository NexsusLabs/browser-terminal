import Sandbox from "@nyariv/sandboxjs";
import Process, { resolveRelativePath } from "./process";
import { FileFlag } from "browserfs/dist/node/core/file_flag";
import { h32 } from "xxhashjs";

const sandbox = new Sandbox();
const cache: Record<number, ReturnType<typeof sandbox.compileAsync>> = {}

export class Node extends Process {
    async main(): Promise<number | void | undefined> {
        if (!this.args[0]) return; // no file to execute wtf

        const globals = {
            process: {
                args: this.args,
                fs: this.fs,
                cwd: this.cwd,
                print: this.print,
                println: this.println,
                readKey: this.readKey,
                readLine: this.readLine,
                resolveRelativePath,
                fileFlag: FileFlag.getFileFlag
            }
        }

        // read file
        let file = await this.fs.readFile(resolveRelativePath(this.args[0], this.cwd), 'utf-8', FileFlag.getFileFlag('r'));
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