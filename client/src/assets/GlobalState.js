import { reactive } from "vue";

const initialState = {
    currentDirectory: '/',
    consoleLines: []
};
const globalState = reactive(initialState);

export default globalState;