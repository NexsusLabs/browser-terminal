import Process from "./process";
import Bash from "./bin/bash";
import "./style.css";
import { createFS } from "./fs";

const screen = document.getElementById("output")!;

createFS().then((fs) => {
    let bash = new Bash(fs);
    bash.env.PATH = "/usr/bin"
    bash.print = data => {
        screen.append(data);
    }
    document.body.onkeydown = e => {
        let char = e.key;
        if (char == "Enter") char = '\n';
        else if (char == "Backspace") char = '\b';
        bash.handleInput(char);
    }
    document.body.focus();
    bash.main().then(() => screen.innerText = "\n[process exited with code 127 (0x0000007f)]");
});
