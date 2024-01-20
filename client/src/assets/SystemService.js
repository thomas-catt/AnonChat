import SystemApps from '../apps/SystemApps';
import Console from './Console';
import Files from './Files';
import globalState from './GlobalState';
import ProcessService from './ProcessService';

const getDirectoryContents = (dir) => {
    return Object.keys(Files.contents[dir]);
}

const Shell = (program, argv = []) => {
    program(argv, (response) => {
        Console.print(response);
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
        if (!(options?.quietMode || ProcessService.Process)) {
            Console.OutputStream.append(input);
            if (input.length)
                globalState.commandHistory = [input, ...globalState.commandHistory];
        }

        if (isFile) {
            Shell(SystemApps.bash, [programName]);
        } else if (SystemApps[programName]) {
            Shell(SystemApps[programName], argv);
        } else {
            Console.print("Command not found: " + programName);
        }

        if (options?.intro || !(options?.quietMode || ProcessService.Process))
            Console.print(this.shellIntro());
    },
    autocomplete(input, response) {
        const items = getDirectoryContents(globalState.currentDirectory);
        const result = items.find(a => a.toLowerCase().startsWith(input.toLowerCase().replace("./", "").replace("/", "")));

        if (result)
            return response("./" + result);
        
        CLI.execute("ls", {quietMode: true});
        Console.print(this.shellIntro());
        return response(null);
    }
}

export default {
    getDirectoryContents,
    CLI,
    Shell
}