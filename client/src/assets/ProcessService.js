import Console from "./Console";
import SystemService from "./SystemService";

const defaultEventSettings = {
    PrintInput: true,
};

export default {
    Process: null,
    State: {},

    StartProcess(process, argv) {
        try {
            this.Process = process;
            const eventSettings = this.Process.onCreate({argv});
            this.State.__eventSettings__ = defaultEventSettings;
            if (eventSettings)
                this.State.__eventSettings__ = {...defaultEventSettings, ...eventSettings};
        } catch (error) {
            this.KillProcess(-1, error);
        }
    },

    SendInput(input) {
        try {
            if (this.Process && this.Process.onInput) {
                    if (this.State.__eventSettings__.PrintInput)
                        Console.print(input);
                    this.Process.onInput({input});

            }
        } catch (error) {
            this.KillProcess(-1, error);
        }
    },

    SendKeyEvent(event) {
        try {
            if (this.Process && this.Process.onKeyEvent) {
                this.Process.onKeyEvent({event});
                console.log("key event sent");
                
                return true;
            } else {
                return false;
            }
        } catch (error) {
            this.KillProcess(-1, error);
            return false;
        }
    },

    KillProcess(code = 0, error = null) {
        if (code == -1) {
            if (this.Process.Manifest.environment == "production")
                Console.printLn("The application has crashed unexpectedly.");
            else {
                if (error.message)
                    error.toString().split("\n").forEach(line => {
                        Console.printLn(line);
                    });
                else
                    Console.printLn("Error: " + error);

                Console.printLn("<stack trace>");
                Console.printLn(error ? error.stack.split("\n").map(a => `\t${a}`).join("\n") : "No stack trace available.");
                Console.printLn("<end stack trace>");
                Console.printLn("The application will now close.");
            }
        }

        try {
            if (code == 0)
                this.Process.onDestroy();
            this.Process = null;
            Object.keys(this.State).forEach(key => delete this.State[key]);
            Console.print(SystemService.CLI.shellIntro());
        } catch (error) {
            this.KillProcess(-1, error);
        }
    }

}