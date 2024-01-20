import { reactive } from "vue";

const initialState = {
    currentDirectory: '/',
    consoleLines: [],
    commandHistory: []
};
const globalState = reactive(initialState);

export default globalState;