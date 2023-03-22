import Process from "./process";
import Bash from "./bin/bash";
import "./style.css";

const screen = document.getElementById("output")!;

let bash: Process = new Bash();
bash.print = data => {
    screen.append(data);
}
document.body.onkeydown = e => {
    let char = e.key;
    if (char == "Enter") char = '\n';
    else if (char == "Backspace") char = '\b';
    else if (char.length > 1) return;
    bash.handleInput(char);
}
document.body.focus();
bash.main().then(() => screen.innerText = "\n[process exited with code 127 (0x0000007f)]");