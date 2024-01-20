import Console from "./Console";
import SystemService from "./SystemService";

export default {
    Process: null,
    State: {count: 1},

    StartProcess(process, argv) {
        this.Process = process;
        this.State = process.onCreate(argv);
    },

    KillProcess() {
        this.Process = null;
        this.State = {};
        Console.print(SystemService.CLI.shellIntro());
    }

}