import Console from "@/assets/Console";
import ProcessService from "@/assets/ProcessService";
import SystemService from "@/assets/SystemService";

const Content = (argv, response) => {
    return response("This will be the chat app.");
}

const printCount = (appState) => Console.print(`You typed: ${appState.input} (x${appState.count})`);


const onCreate = (argv) => {
    let appState = {
        count: 0,
        input: "",
    };

    Console.print("Writing game\nType something (exit to exit): ");
    return appState
}

const onInput = (input, appState) => {
    if (input == "exit") {
        return ProcessService.KillProcess();
    }
    
    appState.input = input;
    appState.count++;
    printCount(appState);
    Console.print("Type something (exit to exit): ");
}

const onDestroy = (appState) => {
    Console.print("Bye-bye!");
}

const Manifest = {
    name: "Chat App",
    description: "An anonymous chat app that I intend to make.",
    process: true,
}

export default {
    Content,
    onCreate,
    onInput,
    onDestroy,
    Manifest
}