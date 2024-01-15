import Files from "@/assets/Files";
import globalState from "@/assets/GlobalState";
import SystemService from "@/assets/SystemService";

const packages = {
    reboot(argv, response) {
        response([
            "# # ThomasCLI v0.1.0 # # ",
            "",
            "  # This ugly CLI enables you to do nothing",
            "  # Linux commands work, partly. But I intend",
            "  # to use this as a host for some of my",
            "  # projects (would be nice, no? please?)",
            ""
        ].join("\n"))
    },
    apt(argv, response) {
        return response("Did you really expect me to develop a full-fledged package manager inside this?");
    },
    chmod(argv, response) {
        return response("You already have all the permissions you can get.");
    },
    chown(argv, response) {
        return response("You already have all the permissions you can get.");
    },
    bash(argv, response) {
        let filename = argv[0];
        const isFile = filename.startsWith("./") || filename.startsWith("/");
        
        if (!isFile) {
            return SystemService.CLI.execute(filename, {quietMode: true});
        }
        filename = filename.replace("./", "").replace("/", "");

        const item = Files.contents[globalState.currentDirectory][filename];
        
        if (!item) {
            return response(`bash ${filename}: not found`);
        } else if (item.Content) {
            // executable
            SystemService.Shell(item.Content);
        } else {
            item.split("\n").forEach(line => {
                SystemService.CLI.execute(line, {quietMode: true});
            });
        }    
    },
    cat(argv, response) {
        let filename = argv[0];
        const isFile = filename.startsWith("./") || filename.startsWith("/");
        if (!isFile) {
            return
        }
        filename = filename.replace("./", "").replace("/", "");
        const item = Files.contents[globalState.currentDirectory][filename];

        if (!item) {
            return response(`cat ${filename}: not found`);
        } else if (item.Content) {
            // executable
            return response(`cat ${filename}: executable detected, response refused.`);
        } else {
            return response(item);
        }    
    },
    help(argv, response) {
        return response([
            "A linux command line. (Or atleast looking like one)",
            "Try out linux stuff.",
            "I'll probably add some apps to make here."
        ].join("\n"))
    },
    echo(argv, response) {
        return response(argv.join(" "));
    },
    ls(argv, response) {
        const items = SystemService.getDirectoryContents(globalState.currentDirectory);
        if (argv[0] == '-l')
            return response(items.join("\n"));
        else
            return response(items.join(" "));
    },
    ll(argv, response) {
        return SystemService.CLI.execute("ls -l " + argv.join(" "), {quietMode: true});
    },
    rm(argv, response) {
        if (argv.includes ('-rf'))
            return response("Your miserable attempt failed. (I will not let you do that)");

        return response("There's no real file system so this won't work.");
    },
    cp(argv, response) {
        return response("There's no real file system so this won't work.");
    },
    mv(argv, response) {
        return response("There's no real file system so this won't work.");
    },
    mkdir(argv, response) {
        return response("There's no real file system so this won't work.");
    },
    nano(argv, response) {
        prompt("You want an editor? Here. Write some stuff here. Press OK when you're done. This won't be saved btw.")
        return response("Hope you enjoyed.");
    },
    su(argv, response) {
        return response("Unavailable.");
    },
    sudo(argv, response) {
        return SystemService.CLI.execute(argv.join(" "), {quietMode: true});
    },
    pwd(argv, response) {
        return response(globalState.currentDirectory);
    },
    clear() {
        SystemService.ConsoleInterface.OutputStream.clear();
    },
    exit(argv, response) {
        response("Self-destruct in 1 second.");
        setTimeout(() => {
            document.body.innerHTML = '<code class="c-red">console killed. F5 to reload.</code>'
        }, 1000)
    },
    [""]: (argv, response) => {

    }
};

export default packages;