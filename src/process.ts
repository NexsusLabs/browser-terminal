import { FS } from "./fs";


export const history: string[] = [];
export let historyIndex = {o: 0};
//@ts-ignore
window._history = history
//@ts-ignore
window._historyI = historyIndex

export function resolveRelativePath(path: string, cwd: string): string {
    const url = new URL(path, "https://0.0.0.0" + cwd);
    return url.pathname;
}

export default abstract class Process {

    args: string[];
    cwd = "/";
    env: Record<string, string> = {};

    constructor(public fs: FS, ...args: string[]) {
        this.args = args;
    }

    abstract main(): Promise<number | void | undefined>

    print(data: string) { }
    println(data?: string) {
        this.print(data ? (data + '\n') : '\n');
    }
    handleInput = (data: string) => {
        for (const handler of this.onInput) {
            handler[0](data);
        }
        this.onInput = this.onInput.filter(handler => !handler[1])
    }

    onInput: [((data: string) => void), boolean][] = [];

    async readKey(show = true, surpressSpecial = true): Promise<string> {
        let char = '';
        do {
            char = await new Promise<string>(resolve => this.onInput.push([resolve, true]));
            if (char.length > 1 && surpressSpecial) char = '';
        } while (char == '')
        if (show) this.print(char);
        return char;
    }

    async readLine(): Promise<string> {
        const input = document.getElementById("input")!;
        let result = '';
        console.log(history, historyIndex)
        while (true) {
            const char = await this.readKey(false, false);
            console.log(char)
            if (char == '\b') result = result.slice(0, Math.max(result.length - 1, 0));
            else if (char == '\n') {
                input.innerText = '';
                this.print(result + '\n');
                if (result != '\n' && result != '') {
                    if(historyIndex.o != history.length)
                        history.splice(historyIndex.o, 1);// bring that history item to the front
                    history.push(result);
                    historyIndex.o = history.length;
                }
                return result;
            }
            else if (char == 'ArrowUp') {
                if (historyIndex.o  > 0) {
                    historyIndex.o--;
                }
                result = history[historyIndex.o] || ''
            }
            else if (char == 'ArrowDown') {
                if (historyIndex.o < history.length) {
                    historyIndex.o++;
                }
                result = history[historyIndex.o] || ''
            }
            else if (char.length == 1) result += char;
            input.innerText = result;
        }
    }

    async runSubprocessAndMapInputs(process: Process, cwd?: string, env?: Process['env'], print = this.print) {
        process.cwd = resolveRelativePath(cwd || '.', this.cwd);
        process.env = { ...this.env, ...env };
        process.print = print;
        this.onInput.push([process.handleInput, false]);
        await process.main();
        this.onInput = this.onInput.filter(handler => handler[0] !== process.handleInput);
    }
}