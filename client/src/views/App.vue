<template>
    <pre class="console-line">{{ consoleLines.join("\n") }}</pre>
    <input class="input-line" contenteditable="true" @keydown="inputEventHandler" @keyup="inputEventHandler" @input="onInputChange" v-model="consoleInput" />
</template>
<script>
import SystemService from '@/assets/SystemService';
import globalState from '@/assets/GlobalState';
import Console from '@/assets/Console';
import ProcessService from '@/assets/ProcessService';

export default {
    data() {
        return {
            consoleLines: [],
            consoleInput: "",
            refreshState: false,
            historyIndex: 0
        }
    },
    methods: {
        processEventHandler(event) {
            if (event.ctrlKey && event.type == "keydown") {
                switch (event.key) {
                    case 'c': case 'x':
                        Console.OutputStream.append("^" + event.key.toUpperCase());
                        ProcessService.KillProcess();
                        event.preventDefault();
                        break;

                    default:
                        ProcessService.SendKeyEvent(event);
                        break;
                }
            } else if (ProcessService.SendKeyEvent(event)) {
                event.preventDefault();
            } else if (event.type == "keydown") {
                switch (event.key) {
                    case "Enter":
                        event.preventDefault();
                        this.enterInput(this.consoleInput.trim());
                        this.consoleInput = '';
                        break;
                }
            }
        },
        inputEventHandler(event) {
            if (ProcessService.Process)
                return this.processEventHandler(event);

            if (event.type != "keydown") return;
            
            if (event.ctrlKey) {
                switch (event.key) {
                    case 'l':
                        SystemService.CLI.execute("clear", {quietMode: true, intro: true});
                        event.preventDefault();
                        break;
                        
                    case 'c': case 'x':
                        this.consoleInput += "^" + event.key.toUpperCase();
                        event.preventDefault();
                        break;
                }
            }
            
            switch (event.key) {
                case "Enter":
                    event.preventDefault();
                    this.historyIndex = 0;
                    this.enterInput(this.consoleInput.trim());
                    this.consoleInput = '';
                    break;
            
                case "Tab":
                    event.preventDefault();
                    this.historyIndex = 0;
                    SystemService.CLI.autocomplete(this.consoleInput.substr(this.consoleInput.lastIndexOf(' ') + 1).trim(), (response) => {
                        if (response) {
                            this.consoleInput = this.consoleInput.substr(0, this.consoleInput.lastIndexOf(' ') + 1) + response;
                        }
                    });
                    break;
                    
                case "ArrowUp": case "ArrowDown":
                    if (globalState.commandHistory.length > 0) {
                        this.consoleInput = globalState.commandHistory[this.historyIndex];
                        const direction = event.key == "ArrowUp" ? 1 : -1;
                        let index = this.historyIndex + direction;

                        if (index >= globalState.commandHistory.length) index = globalState.commandHistory.length - 1;
                        if (index < 0) index = 0;
                        
                        this.historyIndex = index;
                    }                    
                    break;
            }
        },
        onInputChange(event) {
            this.historyIndex = 0;
        },
        enterInput(input) {
            Console.InputStream.send(input);
        }
    },
    mounted() {
        SystemService.CLI.execute("reboot", {quietMode: true, intro: true});
        this.consoleLines = globalState.consoleLines
    }
}
</script>