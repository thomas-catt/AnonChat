import Console from "@/assets/Console";
import ProcessService from "@/assets/ProcessService";

const initialState = {
    userId: "",
}


const onCreate = ({argv}) => {
    Console.print("Welcome to the Chat App!");
    return initialState
}

const onKeyEvent = ({event, state}) => {
    console.log(event);
    Console.print(event.type + " " + event.key);
}

const onDestroy = (state) => {
    Console.print("Bye-bye!");
}

const Manifest = {
    name: "Chat App",
    description: "An anonymous chat app that I intend to make.",
    process: true,
    environment: "debug",
}

export default {
    onCreate,
    onKeyEvent,
    onDestroy,
    Manifest
}