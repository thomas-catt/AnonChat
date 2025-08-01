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

const getColor = (userId) => {
    const colors = [
        {bg: "red-dark", text: "white"},
        {bg: "red", text: "white"},
        {bg: "red-bright", text: "white"},
        {bg: "green-dark", text: "white"},
        {bg: "green", text: "black"},
        {bg: "green-bright", text: "black"},
        {bg: "yellow-dark", text: "white"},
        {bg: "yellow", text: "black"},
        {bg: "yellow-bright", text: "black"},
        {bg: "blue-dark", text: "white"},
        {bg: "blue", text: "white"},
        {bg: "blue-bright", text: "white"},
        {bg: "magenta-dark", text: "white"},
        {bg: "magenta", text: "white"},
        {bg: "magenta-bright", text: "white"},
        {bg: "cyan-dark", text: "white"},
        {bg: "cyan", text: "black"},
        {bg: "cyan-bright", text: "black"}
    ];

    // generate random number based on userId
    var i = 0, n = 0;
    while (i < userId.length) {
        if (isNaN(parseInt(userId[i]))) {
            i++;
            continue;
        }
        n += parseInt(userId[i], 10);
        i++;
    }
    const index = n % colors.length; // Use last character of userId for color
    return colors[index];
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
        // reconnection: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
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

    const connectionError  = (reason) => {
        Console.print("Failed to connect to chat server (" + reason + "), type /connect to try again." + "\n", {text: "white", bg: "red"});
        ProcessService.State.connectionStatus = "disconnected";
        if (pingInterval) clearInterval(pingInterval);
    }

    ProcessService.State.socket.on("connect_error", () => connectionError("unknown error occured"));
    ProcessService.State.socket.on("reconnect_error", () => connectionError("unknown error occured"));
    ProcessService.State.socket.on("reconnect", () => {
        ProcessService.State.connectionStatus = "connected";
        Console.print("Connection reestablished.\n", {text: "green"});
    });


    ProcessService.State.socket.on("reconnect_failed", () => {
        Console.print("Failed to reconnect to chat server, it's probably down right now.\n", {text: "red"});
        ProcessService.State.connectionStatus = "disconnected";
        if (pingInterval) clearInterval(pingInterval);
    });

    ProcessService.State.socket.on("disconnect", () => {
        Console.print("Lost connection to chat server 🥀, type /connect to connect again." + "\n", {text: "red"});
        ProcessService.State.connectionStatus = "disconnected";
        if (pingInterval) clearInterval(pingInterval);
    });

    ProcessService.State.socket.on("online-users", ({userId, action, onlineUsers, afkUsers}) => {
        const color = getColor(userId);
        
        ProcessService.State.onlineUsers = onlineUsers;
        ProcessService.State.afkUsers = afkUsers;
        if (action === "connect") {
            if (userId === ProcessService.State.userId) {
                Console.print(`${ProcessService.State.onlineUsers} users currently online.` + "\n", {text: "green"});
                Console.print(`Your color is `, {text: "gray"});
                Console.print(color.bg + "\n", color);
            } else {
                Console.print(`An anonymous user`, color);
                Console.print(` has joined. (${ProcessService.State.onlineUsers} online)` + "\n", {text: "green"});
            }
            
        } else if (action === "afk") {
            Console.print(`An anonymous user`, color);
            Console.print(` has gone AFK. (${ProcessService.State.onlineUsers} online, ${ProcessService.State.afkUsers} AFK)` + "\n", {text: "yellow"});
        } else if (action === "back") {
            Console.print(`An anonymous user`, color);
            Console.print(` is back from being AFK. (${ProcessService.State.onlineUsers} online, ${ProcessService.State.afkUsers} AFK)` + "\n", {text: "green"});
        } else if (action === "remove") {
            Console.print(`An AFK user has been removed for being AFK. (${ProcessService.State.onlineUsers} online)` + "\n", {text: "red"});
        } else if (action === "disconnect") {
            Console.print(`An anonymous user`, color);
            Console.print(` has left. (${ProcessService.State.onlineUsers} online)` + "\n", {text: "red"});
        }
    });

    ProcessService.State.socket.on("pong", ({onlineUsers, afkUsers, latency}) => {
        ProcessService.State.onlineUsers = onlineUsers;
        ProcessService.State.afkUsers = afkUsers;
        ProcessService.State.latency = latency;

        if ((latency >= 500) && !ProcessService.State.latencyWarned) {
            Console.print(`[!] You have very high latency (${latency}ms) from the chat server. Chat would feel very slow or delayed.` + "\n", {bg: "yellow-dark", bold: true});
            ProcessService.State.latencyWarned = true;
        }
    });

    ProcessService.State.socket.on("message", (message) => {
        const color = getColor(message.userId);
        console.log(color, message);
        
        Console.print(formatDate(message.time) + " ", {text: "gray"});
        Console.print(" > ", color);
        Console.print(message.message + "\n");
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
    Console.print("Type /exit to leave or /status to check info.\n");
    Console.print("See /help for all commands.\n");
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
                const color = getColor(ProcessService.State.userId);
                Console.print(`Your color: `);
                Console.print(color.bg + "\n", color);
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
                ProcessService.State.socket.emit("message", {time: new Date(), message: input, userId: ProcessService.State.userId});
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