class BlockMenu {
    constructor(nodeToMenufy){
     
        var menuMethods = Object.getOwnPropertyNames(nodeToMenufy)

        this.menu = document.createElement('menu')
        var container = nodeToMenufy.getClientRects()[0]
        var containerStyle = getComputedStyle(nodeToMenufy)
        var header = nodeToMenufy.querySelector("header").getClientRects()[0]
        var left = container.left
        var top = container.top + header.height
        var width = container.width
        var height = container.height - header.height
        var newMenuStyle = { 
            width, height, left, top, 
            border: containerStyle.borderWidth + ' solid transparent',
        }
        Object.assign(this.menu.style, newMenuStyle)

        menuMethods.forEach(name => {
            var menuItem = document.createElement('li')
            console.log(name)
            var methodName = name
            menuItem.textContent = name.replace(/_/g,' ')
            menuItem.addEventListener('mousedown', () => nodeToMenufy[name]())
            this.menu.appendChild(menuItem)
        })

        var dissolveMenu = () => {
            this.menu.remove() // creating a function reference to add and remove lisener
            document.body.removeEventListener('mouseup', dissolveMenu)
            nodeToMenufy.removeEventListener('mousedown', dissolveMenu)
        }
        document.body.addEventListener('mouseup', dissolveMenu)
        nodeToMenufy.addEventListener('mousedown', dissolveMenu)
    }
}

class BlockHeader {
    constructor(options){
        this.header = parseHTML(`
            <header>
                ${options.title}
                <button></button>
            </header>`)
        this.header.querySelector('button').addEventListener('click', event => {
            document.body.appendChild(new BlockMenu(this.header.parentElement).menu)
        })
        this.header.addEventListener('mousedown', handleDrag)
    }
}

class Block {
    constructor(options = {}){
        this.block = parseHTML(`
            <div>
                <div class='next'></div>
                <textarea spellcheck=false 
                          onfocus="focus(this.parentElement)" 
                          onblur="focus()">
                </textarea>
            </div>
        `)

        this.block.insertBefore(new BlockHeader(options).header, this.block.firstChild)
        this.textarea = this.block.querySelector('textarea')
        this.textarea.value = options.text || ''
        /* Default Style, properties provided here are overrided by a style object on options */
        this.style = Object.assign({
            left: '0px', 
            top: '0px', 
            position: 'relative', 
            width: '400px', 
            height: '200px'
        }, options.style)

        delete options.style
        delete options.text

        this.attributes = Object.assign({
            type: "Block", 
            id: 't' + Date.now()
        },options)

        this.block.remove_from_window = this.remove_from_window
        this.block.remove_from_window = this.remove_from_window
    }

    set style(newStyle){
        var {width, height} = newStyle
        delete newStyle.width
        delete newStyle.height
        Object.assign(this.block.style, newStyle) //new Position might have left, top, position, width, height properties
        Object.assign(this.textarea.style, {width, height})
    }

    set attributes(updateObject){
        for(var key in updateObject){
            this.block.setAttribute(key, updateObject[key])
        }
    }

    get attributes(){
        var tempObj = {}
        Array.from(this.block.attributes).forEach(attribute => {
            tempObj[attribute.name] = attribute.value
        })
        return tempObj
    }

    remove_from_window(){
        this.remove()
    }

    write_to_disk(){
        // grab filename and PUT to it
        var destination = this.block.getAttribute('filename')
        if(!destination) destination = prompt("I need a filename. You can include a directory if the directory already exists.")

        fetch(destination, {
            method: 'PUT',
            credentials: 'same-origin',
            body: this.textContent
        })
    }

    update_from_disk(){
        // grab filename and GET from it, replace textContent
    }

    become_codemirror(){
        // grab own attributes, return an object to generate new block derivative
        // replace self with new Child
    }

    share_link(){
        // determine link to pull this node
    }
}


function edit(filename){
    fetch(filename, {credentials: 'same-origin'})
    .then(res => res.text())
    .then(plainText => {
        document.body.appendChild(new Block({
            style: {
                left: screen.availWidth / 4 + ( Math.random() * ( screen.availWidth / 3 ) ),
                top:  Math.random() * ( screen.availHeight  /  4 ),
                position: 'fixed'
            },
            // draggable: true,
            filename: filename,
            title: filename,
            tabIndex: 1,
            class: 'block',
            text: plainText
        }).block)
    })
    .catch(error => {
        console.error(error)
    })
}