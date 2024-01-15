const Content = (argv, response) => {
    return response("This will be the chat app.");
}

const Manifest = {
    name: "Chat App",
    description: "An anonymous chat app that I intend to make.",
}

export default {
    Content,
    Manifest
}