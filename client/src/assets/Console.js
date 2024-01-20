import globalState from "./GlobalState";
import ProcessService from "./ProcessService";
import SystemService from "./SystemService";

const InputStream = {
    send(input) {
        if (ProcessService.Process) {
            Console.OutputStream.append(input);
            ProcessService.Process?.onInput(input, ProcessService.State);
        } else {
            SystemService.CLI.execute(input);
        }
    }
}

const print = (input) => {
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