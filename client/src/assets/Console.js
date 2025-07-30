import globalState from "./GlobalState";
import ProcessService from "./ProcessService";
import SystemService from "./SystemService";

const InputStream = {
    send(input) {
        if (ProcessService.Process) {
            ProcessService.SendInput(input);
        } else {
            SystemService.CLI.execute(input);
        }
    }
}

const print = (input) => {
    if (input === undefined) input = "undefined";
    if (input === null) input = "null";
    if (typeof input !== "string")
        input = JSON.stringify(input, null, 2);
    Console.OutputStream.send(input);
}

let Console = {
    OutputStream: {
        send(content) {
            content.split('\n').forEach(line => {
                globalState.consoleLines.push(line);
            });
        },
        append(content) {
            globalState.consoleLines[globalState.consoleLines.length - 1] += content;
        },
        clear() {
            while (globalState.consoleLines.length)
                globalState.consoleLines.pop();

        }
    },
    InputStream,
    print
}


export default Console