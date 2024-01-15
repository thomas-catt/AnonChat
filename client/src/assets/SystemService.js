import SystemApps from '../apps/SystemApps';
import Files from './Files';
import globalState from './GlobalState';

const getDirectoryContents = (dir) => {
    return Object.keys(Files.contents[dir]);
}

let ConsoleInterface = {
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
    InputStream: {
        send(content) {
            
        }
    }
}


const Shell = (program, argv = []) => {
    program(argv, (response) => {
        ConsoleInterface.OutputStream.send(response);
    });
}

let CLI = {
    shellIntro() {
        return `${globalState.currentDirectory} $ `
    },
    execute(input, options) {
        let programName = input.split(" ")[0];        
        const isFile = input.startsWith("./") || input.startsWith("/");
        
        // if (isFile)
        //     programName = programName.substr(2);
    
        const argv = input.substr(input.indexOf(" ") + 1).split(" ");
        if (!options?.quietMode)
            ConsoleInterface.OutputStream.append(input);

        if (isFile) {
            Shell(SystemApps.bash, [programName]);
        } else if (SystemApps[programName]) {
            Shell(SystemApps[programName], argv);
        } else {
            ConsoleInterface.OutputStream.send("Command not found: " + programName);
        }

        if (!options?.quietMode)
            ConsoleInterface.OutputStream.send(this.shellIntro());
    },
    autocomplete(input, response) {
        const items = getDirectoryContents(globalState.currentDirectory);
        const result = items.find(a => a.toLowerCase().startsWith(input.toLowerCase().replace("./", "").replace("/", "")));

        if (result)
            return response("./" + result);
        
        CLI.execute("ls", {quietMode: true});
        ConsoleInterface.OutputStream.send(this.shellIntro());
        return response(null);
    }
}

export default {
    getDirectoryContents,
    ConsoleInterface,
    CLI,
    Shell
}