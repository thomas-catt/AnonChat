<template>
<div
    class="focus-redirect-underlay"
    @click="$refs.inputLine && $refs.inputLine.focus()"
></div>
<div ref="consoleLine" class="console-line">
    <span v-for="(line, idx) in consoleLines" :key="idx" :class="'c-' + consoleLineColors[idx].text + ' bg-' + consoleLineColors[idx].bg">{{ line }}</span>
    <div contenteditable="true" ref="inputLine" class="input-line" @keydown="inputEventHandler" @keyup="inputEventHandler" @input="onInputChange"></div>
</div>
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
            consoleLineColors: [],
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
                        Console.print("^" + event.key.toUpperCase());
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
                        event.target.textContent = '';
                        break;
                }
            }
        },
        inputEventHandler(event) {
            this.consoleInput = event.target.textContent || '';
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
                        event.target.textContent += "^" + event.key.toUpperCase();
                        event.preventDefault();
                        break;
                }
            }
            
            switch (event.key) {
                case "Enter":
                    event.preventDefault();
                    this.historyIndex = 0;
                    this.enterInput(this.consoleInput.trim());
                    event.target.textContent = '';
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
                        event.target.textContent = globalState.commandHistory[this.historyIndex];
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
        // SystemService.CLI.execute("reboot", {quietMode: true, intro: true});
        SystemService.CLI.execute("./chat", {quietMode: true});
        this.consoleLines = globalState.consoleLines
        this.consoleLineColors = globalState.consoleLineColors

        this.$nextTick(() => {
            this.$refs.inputLine && this.$refs.inputLine.focus();
            // Focus input on any click anywhere in the window
            window.addEventListener("click", () => {
                this.$refs.inputLine && this.$refs.inputLine.focus();
            });
            document.body.addEventListener("click", () => {
                this.$refs.inputLine && this.$refs.inputLine.focus();
            });
        });

    }
}
</script>