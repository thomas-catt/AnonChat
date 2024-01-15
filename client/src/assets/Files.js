import ChatApp from "../apps/ChatApp";
import README from "../assets/README.txt";
import SystemService from "./SystemService";

const contents = {
    '/': {
        'chat': ChatApp,
        'README.txt': `Some notes I'll leave here`
    }
}

const run = (directory, filename) => {
    ConsoleInterface.OutputStream.send(this.shellIntro());
}

export default {
    contents,
    run
}