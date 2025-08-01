import { reactive } from "vue";

const initialState = {
    currentDirectory: '/',
    consoleLines: [],
    consoleLineColors: [],
    commandHistory: []
};
const globalState = reactive(initialState);

export default globalState;