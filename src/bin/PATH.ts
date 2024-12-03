import Process from "../process";
import Bash from "./bash";
import { FS } from "../fs";
import { Node } from "../execute";

const PATH: Record<string, undefined | (() => (new(fs: FS, ...args: string[])=> Process))> = {
    'bash': () => Bash,
    'node': ()=> Node
};
export default PATH;