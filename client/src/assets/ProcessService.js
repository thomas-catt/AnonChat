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
            this.State = this.Process.onCreate({argv});
            this.State.__eventSettings__ = defaultEventSettings;
        } catch (error) {
            this.KillProcess(-1, error);
        }
    },

    SendInput(input) {
        try {
            if (this.Process && this.Process.onInput) {
                    if (this.State.__eventSettings__.PrintInput)
                        Console.OutputStream.append(input);
                    this.Process.onInput({input, state: this.State});

            }
        } catch (error) {
            this.KillProcess(-1, error);
        }
    },

    SendKeyEvent(event) {
        try {
            if (this.Process && this.Process.onKeyEvent) {
                this.Process.onKeyEvent({event, state: this.State});
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
                Console.print("The application has crashed unexpectedly.");
            else {
                if (error.message)
                    error.toString().split("\n").forEach(line => {
                        Console.print(line);
                    });
                else
                    Console.print("Error: " + error);

                Console.print("<stack trace>");
                Console.print(error ? error.stack.split("\n").map(a => `\t${a}`).join("\n") : "No stack trace available.");
                Console.print("<end stack trace>");
                Console.print("The application will now close.");
            }
        }
        this.Process = null;
        this.State = {};
        Console.print(SystemService.CLI.shellIntro());
    }

}