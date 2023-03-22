import Process from "../process";

export default class Echo extends Process {
    async main() {
        this.println(this.args.join(' '));
    }
}