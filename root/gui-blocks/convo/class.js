/* interesting. PartyBlock could extend ConvoBlock or ShellBlock, depending on if you want localEval and changeDirectory to be a thing */
class ConvoBlock extends ProtoBlock {
    constructor(options){
        super(options)
    }

    static get actions(){
        return {
            "clear convo": {
                func: this.prototype.clearConvo,
                info: "the equivelant of typing 'clear' into the shell, simply deletes existing message blocks from this interface. Note this does not touch any files on disk"
            },
            "convo mode": {
                func: this.prototype.switchMode,
                args: [{select: ["self","party"]}]
            }
        }
    }

    connectedCallback(){    
        this.init()
        this.head.textContent = location.host
        this.form = this.body.firstElementChild
        this.input = this.form.firstElementChild
        window.autoSubmit = this.autoSubmit.bind(this)

        if(this.props.convomode == 'party'){
            this.addEventListener('init', () => {
                this.startMultiPlayer()
                this.form.onsubmit = this.handleParty.bind(this)                    
            })
        } else {
            this.autoSubmit(this.getAttribute('init'))
            this.form.onsubmit = this.handleSubmit.bind(this)        
        }

        // A couple of ways to focus on the input. Click empty space, hit escape no matter what
        document.documentElement.addEventListener('click', event => event.target === document.body 
                                                                 || event.target === document.documentElement
                                                                 || event.target === this
                                                                 && this.input.focus())
        document.body.addEventListener('keyup', event => event.key === 'Escape' && this.input.focus())
    }

    switchMode(newMode){
        this.setAttribute('convomode', newMode)
        this.become() // aka 'become self', or re-initialize with new attribute set
    }

    /* changing convo modes will reload this component. become itself but with new attributes - set convoMode as multiplayer */
    startMultiPlayer(){
        // set attribute convoPartner: party, or group name whatever.
        // oh yeah I still want locally evallable js to eval on everyone's machine cuz its hilarious and strange
        // allow convo partner to eval code in this window - just an options
        // the fetch to tail should be recursively promise itself - I expect each new tail response should be 512 bytes max, so never split up across blobs
        fetch('/?' + encodeURI('tail -f .convolog'), { method: 'POST', credentials: "same-origin", redirect: "error" })
        .then(response => response.body.getReader())
        .then(this.consumeStream.bind(this))
        .catch(err => {
            console.error(err)
            console.error('multiplayer convo requires responseStream API, available in chrome')
        })
    }
            
    consumeStream(reader){
        /* might handle the strage use case of tailing a file and searching for the first newline char and parsing from there */
        if(!reader) return null  // consumeStream will exit if the text was consumed already
        this.streambuffer || (this.streambuffer = '') //if streambuffer is undefined, create it
        /* recursively call consumeStream. reader.read() is a promise that resolves as soon as a chunk of data is available */
        return reader.read().then(sample => {
            if(sample.value){
                this.streambuffer += textDecoder.decode(sample.value)
                if(this.streambuffer.match(/}\s*$/)){
                    this.streambuffer.split(/\n(?={)/g).forEach(JSONchunk => {
                        // append a new message with the properties 
                        let incomingData = JSON.parse(JSONchunk)
                        if(incomingData.heartbeat) return null // exit if JSON data was just a heartbeat keeping the connection alive
                        var newMessage = document.createElement('message-block')
                        this.next.appendChild(newMessage)
                        newMessage.props = incomingData
                    })
                    delete this.streambuffer
                }
                return this.consumeStream(reader)
            }
        })
    }

    handleParty(event){
        event && event.preventDefault()// suppress default action of reloading the page if handleSubmit was called by event listener        
        let message = this.input.value || '...'
        let time = Date.now()
        // alright this is a little crazy but shells require different escape sequences so its actually kind of hard to just pipe arbitrary strings to file when they contain bash/csh/zsh control characters. 
        // So I'll avoid control characters by base64 encoding my JSON string, and piping that string through the coreutils program 'base64' before saving it to file.
        let convoString = btoa(JSON.stringify({time, message}) + '\n')
        fetch('/?' + encodeURI('printf ' + convoString + ' | base64 -d >> .convolog'), {method: "POST", credentials: "same-origin", redirect: "error"})
        .catch(console.error.bind(console))
    }

    handleSubmit(event, options = {headless: false}){
        event && event.preventDefault()// suppress default action of reloading the page if handleSubmit was called by event listener
        var newMessage = document.createElement('message-block')
        newMessage.props = {
            action: '/?' + encodeURI(this.input.value || '...'),
            method: 'POST',
            input: this.input.value || '...',
            headless: options.headless
        }
        this.next.appendChild(newMessage)
        this.input.value = '' // reset input to blank (if there's not a keepInput prop on options)
    }

    /* programmatically submit input for chatbot to response to. defaults to headless, ie, don't show the input */
    autoSubmit(string2submit, options = {headless: true}){
        var oldstring = this.input.value
        this.input.value = string2submit
        this.handleSubmit(null, options)
        this.input.value = oldstring
    }

    clearConvo(){
        while (this.next.hasChildNodes()){
            this.next.removeChild(this.next.lastChild) 
        }
    }
}
customElements.define('convo-block', ConvoBlock)