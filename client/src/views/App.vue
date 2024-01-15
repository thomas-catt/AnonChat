<template>
    <pre class="console-line">{{ consoleLines.join("\n") }}</pre>
    <input class="input-line" contenteditable="true" @keydown="inputEventHandler" v-model="consoleInput" />
</template>
<script>
import SystemService from '@/assets/SystemService';
import globalState from '@/assets/GlobalState';
import { extractIdentifiers } from 'vue/compiler-sfc';

export default {
    data() {
        return {
            consoleLines: [],
            consoleInput: "",
            refreshState: false,
        }
    },
    methods: {
        inputEventHandler(event) {
            if (event.ctrlKey) {
                switch (event.key) {
                    case 'l':
                        this.enterInput("clear");
                        event.preventDefault();
                        break;
                        
                    case 'c':case 'x':
                        if (event.key.length == 1)
                            this.consoleInput += "^" + event.key.toUpperCase();
                        
                        event.preventDefault();
                        break;
                }
            }
            
            if (event.key == "Enter") {
                event.preventDefault();
                this.enterInput(this.consoleInput.trim());
                this.consoleInput = '';
            } else if (event.key == "Tab") {
                event.preventDefault();
                SystemService.CLI.autocomplete(this.consoleInput.substr(this.consoleInput.lastIndexOf(' ') + 1).trim(), (response) => {
                    if (response) {
                        this.consoleInput = this.consoleInput.substr(0, this.consoleInput.lastIndexOf(' ') + 1) + response;
                    }
                });
            }
        },
        enterInput(input) {
            SystemService.CLI.execute(input);
        }
    },
    mounted() {
        SystemService.CLI.execute("reboot");
        this.consoleLines = globalState.consoleLines
    }
}
</script>