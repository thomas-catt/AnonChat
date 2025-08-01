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

const print = (input, colors) => {
    // if (input === undefined) input = "undefined";
    // if (input === null) input = "null";
    // if (typeof input !== "string")
    //     input = JSON.stringify(input, null, 2);
    Console.OutputStream.append(input, colors);
}

const printLn = (input, colors) => {
    print(input + "\n", colors);
}

let Console = {
    OutputStream: {
        append(content, colors) {
            // if (globalState.consoleLines.length === 0)
                // globalState.consoleLines.push("");
            // globalState.consoleLines[globalState.consoleLines.length - 1] += content;
            globalState.consoleLines.push(content);
            globalState.consoleLineColors.push({text: "white", bg: "black", ...colors});
            // Scroll to bottom after DOM update
            setTimeout(() => {
                const inputLine = document.querySelector(".input-line");
                if (inputLine) {
                    inputLine.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }, 0);
        },
    },
    InputStream,
    clear() {
        while (globalState.consoleLines.length)
            globalState.consoleLines.pop();
        while (globalState.consoleLineColors.length)
            globalState.consoleLineColors.pop();
    },
    print,
    printLn
}


export default Console