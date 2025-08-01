import Console from "@/assets/Console";
import ProcessService from "@/assets/ProcessService";
import { io } from "socket.io-client";

const initialState = {
    socket: null,
    userId: "not-set",
    connectionStatus: "disconnected", // "disconnected", "connecting", "connected"
    onlineUsers: 0,
    afkUsers: 0,
    latency: -1,
    latencyWarned: false
}

const eventSettings = {
    PrintInput: false,
};

let pingInterval;

const formatDate = (date) => {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(date).toLocaleTimeString([], options);
}


const connectSocket = () => {
    // Placeholder for socket connection logic
    if (ProcessService.State.connectionStatus === "connected" || (ProcessService.State.socket != null && ProcessService.State.socket.connected)) {
        Console.print("Already connected to chat server." + "\n", {text: "yellow"});
        return;
    }

    if (ProcessService.State.connectionStatus === "connecting")
        return;
    
    Console.print("Connecting to chat server..." + "\n", {text: "gray"});
    ProcessService.State.connectionStatus = "connecting";

    // Clean up any existing socket first
    if (ProcessService.State.socket) {
        ProcessService.State.socket.disconnect();
        ProcessService.State.socket = null;
    }

    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:5001`;
    ProcessService.State.socket = io(url, {
        reconnection: false,
        secure: location.protocol === 'https:'
    });

    ProcessService.State.socket.on("connect", () => {
        Console.print("Connected to chat server. " + "\n", {text: "green"});
        ProcessService.State.userId = ProcessService.State.socket.id;
        ProcessService.State.connectionStatus = "connected";
        // Start ping interval
        if (pingInterval) clearInterval(pingInterval);
        pingInterval = setInterval(() => {
            if (document.hasFocus())
                ProcessService.State.socket.emit("ping", { time: new Date(), userId: ProcessService.State.userId });
        }, 2000);
    });

    ProcessService.State.socket.on("connect_error", () => {
        Console.print("Failed to connect to chat server, type /connect to try again." + "\n", {text: "white", bg: "red"});
        ProcessService.State.connectionStatus = "disconnected";
        if (pingInterval) clearInterval(pingInterval);
    });

    ProcessService.State.socket.on("online-users", ({userId, action, onlineUsers, afkUsers}) => {
        ProcessService.State.onlineUsers = onlineUsers;
        ProcessService.State.afkUsers = afkUsers;
        if (action === "connect") {
            if (userId === ProcessService.State.userId) {
                Console.print(`${ProcessService.State.onlineUsers} users currently online.` + "\n", {text: "green"});
            } else {
                Console.print(`An anonymous user has joined. (${ProcessService.State.onlineUsers} online)` + "\n", {text: "green"});
            }
            
        } else if (action === "afk") {
            Console.print(`An anonymous user has gone AFK. (${ProcessService.State.onlineUsers} online, ${ProcessService.State.afkUsers} AFK)` + "\n", {text: "yellow"});
        } else if (action === "back") {
            Console.print(`An anonymous user is back from AFK. (${ProcessService.State.onlineUsers} online, ${ProcessService.State.afkUsers} AFK)` + "\n", {text: "green"});
        } else if (action === "remove") {
            Console.print(`An AFK user has been removed for being AFK. (${ProcessService.State.onlineUsers} online)` + "\n", {text: "red"});
        } else if (action === "disconnect") {
            Console.print(`An anonymous user has left. (${ProcessService.State.onlineUsers} online)` + "\n", {text: "red"});
        }
    });

    ProcessService.State.socket.on("pong", ({onlineUsers, afkUsers, latency}) => {
        ProcessService.State.onlineUsers = onlineUsers;
        ProcessService.State.afkUsers = afkUsers;
        ProcessService.State.latency = latency;

        if ((latency >= 1000) && !ProcessService.State.latencyWarned) {
            Console.print(`[!] You have very high latency (${latency}ms) from the chat server. Messages would feel very slow.` + "\n", {bg: "yellow-dark", bold: true});
            ProcessService.State.latencyWarned = true;
        }
    });

    ProcessService.State.socket.on("message", (message) => {
        // if (message.userId != ProcessService.State.userId && message.message) {
            Console.print(formatDate(message.time) + " ", {text: "gray"});
            Console.print(" > ", {text: "cyan", bg: "black"});
            Console.print(message.message + "\n");
        // }
    });

}


const onCreate = ({argv}) => {
    ProcessService.State = initialState;
    
    Console.clear();
    Console.print("                                   \n", {text: "cyan"});
    Console.print("       ___                       \n", {text: "cyan"});
    Console.print("      / _ | ___  ___  ___      \n", {text: "cyan"});
    Console.print("     / __ |/ _ \\/ _ \\/ _ \\    \n", {text: "cyan"});
    Console.print("    /_/_|_/_//_/\\___/_//_/   \n", {text: "cyan"});
    Console.print("     / ___/ /  ___ _/ /_    \n", {text: "cyan"});
    Console.print("    / /__/ _ \\/ _ `/ __/    \n", {text: "cyan"});
    Console.print("    \\___/_//_/\\_,_/\\__/     \n", {text: "cyan"});
    Console.print("                             \n", {text: "cyan"});
    Console.print("                                \n", {text: "cyan"});
    Console.print("\n");
    Console.print("Welcome to the anonymous chat room where every message appears without a name.\n");
    Console.print("\n");
    Console.print("Type /exit to leave or /help for all commands.\n");
    Console.print("\n");

    connectSocket();

    return eventSettings
}

const onInput = ({input, state}) => {
    const cmdColors = {text: "black", bg: "white"};
    const cmdHelp = `/exit:\t\t Exit the app.
/help:\t\t Show this help message.
/connect:\t Connect to the chat server.
/status:\t Show chat information.
/clear:\t\t Clear the chat window.\n`;
    
    if (input.startsWith("/")) {
        // Handle command
        const command = input.slice(1).trim().split(" ")[0];
        switch (command) {
            case "exit":
                ProcessService.KillProcess();
                break;
            case "help":
                Console.print(cmdHelp, cmdColors);
                break;
            case "connect":
                connectSocket();
                break;
            case "status":
                Console.print(`Connection Status: `);
                Console.print(`${ProcessService.State.connectionStatus} [${ProcessService.State.userId}]\n`, {text: {
                    disconnected: "red",
                    connecting: "orange",
                    connected: "green"
                }[ProcessService.State.connectionStatus]});

                Console.print(`Online Users: `);
                Console.print(`${ProcessService.State.onlineUsers}\n`, {text: "green"});
                Console.print(`AFK Users: `);
                Console.print(`${ProcessService.State.afkUsers}\n`, {text: "yellow"});
                Console.print(`Latency: `);
                Console.print(`${ProcessService.State.latency}ms\n`, {text: (ProcessService.State.latency >= 300) ? "red" : (ProcessService.State.latency >= 100) ? "yellow" : "green"});
                break;
            case "clear":
                Console.clear();
                break;
            default:
                Console.print("Unknown command: /" + command + "\n", cmdColors);
                Console.print("Type /help for all commands." + "\n", cmdColors);
        }
    } else {
        if (input.trim().length > 0) {
            try {
                ProcessService.State.socket.emit("message", {time: new Date(), message: input});
            } catch (error) {
                Console.print("Couldn't send message to the chat server.", {text: "white", bg: "red"});
            }
        }
    }
}

const onDestroy = (state) => {
    if (ProcessService.State.socket) {
        ProcessService.State.socket.disconnect();
        Console.print("Disconnected from chat server.\n", {text: "green"});
    }
    clearInterval(pingInterval);
    Console.print("Bye-bye!" + "\n");
}

const Manifest = {
    name: "Chat App",
    description: "An anonymous chat app that I intend to make.",
    process: true,
    environment: "debug",
}

export default {
    onCreate,
    onInput,
    onDestroy,
    Manifest
}