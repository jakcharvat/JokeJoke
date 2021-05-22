import { Character, Side } from '../consts'
import './characterDialog.css'


class CharacterDialog extends HTMLElement {
    constructor() {
        super()

        this.pressSpace = new PressSpace()
        const pressSpaceContainer = new BottomAlignedRow([this.pressSpace])
        pressSpaceContainer.className = 'press-space-container'

        this.leftCharacter = new CharacterContainer(Side.LEFT, () => this.showPressSpace(), () => this.hidePressSpace())
        this.rightCharacter = new CharacterContainer(Side.RIGHT, () => this.showPressSpace(), () => this.hidePressSpace())

        const row = new BottomAlignedRow([this.leftCharacter, this.rightCharacter])
        this.appendChild(row)
        this.appendChild(pressSpaceContainer)

        this.setRightCharacter(Character.THINKING)
    }

    showPressSpace() {
        this.pressSpace.show()
    }

    hidePressSpace() {
        this.pressSpace.hide()
    }

    getImageNamed(name) {
        let image = new Image(200, 200)
        image.src = `../bitmojis/${name}.png`
        return image
    }

    setLeftCharacter(imageName) {
        const image = this.getImageNamed(imageName)
        this.leftCharacter.setChild(image)
    }

    setRightCharacter(imageName) {
        const image = this.getImageNamed(imageName)
        this.rightCharacter.setChild(image)
    }

    onStartTyping() {
        this.setRightCharacter(Character.TYPING)
    }

    onStopTyping() {
        this.setRightCharacter(Character.SLEEPING)
    }

    async hide() {
        const animation = this.animate([
            { opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease',
            fill: 'forwards'
        })

        return new Promise(res => {
            animation.onfinish = () => {
                this.parentElement.removeChild(this)
                res()
            }
        })
    }

    async runScript() {
        const script = await (await fetch('../dialog.txt')).text()
        const lines = script.split('\n')

        for (const line of lines) {
            if (line.startsWith('//')) continue
            if (!line) continue

            const split = line.split(':')
            const opcode = split[0]
            const params = split[1]

            switch(opcode) {
                case 'WAIT':
                    await new Promise(res => setTimeout(res, params))
                    break

                case 'LEFT_IMG':
                    this.setLeftCharacter(params)
                    break

                case 'RIGHT_IMG':
                    this.setRightCharacter(params)
                    break

                case 'LEFT_TXT':
                    await this.leftCharacter.bubble.showText(params)
                    break;

                case 'RIGHT_TXT':
                    await this.rightCharacter.bubble.showText(params)
                    break;

                default:
                    console.error('Missing instruction ' + opcode)
            }
        }

        await this.hide()
    }
}


class BottomAlignedRow extends HTMLElement {
    constructor(children) {
        super()
        children?.forEach(el => this.appendChild(el))
    }
}


class CharacterContainer extends HTMLElement {
    constructor(side, showPressSpace, hidePressSpace) {
        super()

        this.showPressSpace = showPressSpace
        this.hidePressSpace = hidePressSpace

        this.side = side
        this.createBubble(false)
    }

    getShowHideParams() {
        return {
            duration: 100,
            fill: 'forwards',
            easing: 'ease'
        }
    }

    async hideChild() {
        if (!this.child) { return }
        
        const animation = this.child.animate([
            { opacity: 1 },
            { opacity: 0 }
        ], this.getShowHideParams())

        await new Promise(res => {
            animation.onfinish = () => {
                this.removeChild(this.child)
                res()
            }
        })
    }

    async showChild(child) {
        this.child = child
        this.child.style.opacity = 0
        this.appendChild(child)

        await new Promise(res => setTimeout(res, 50))
        const animation = this.child.animate([
            { opacity: 1 }
        ], this.getShowHideParams())

        await new Promise(res => {
            animation.onfinish = res
        })
    }

    async setChild(child) {
        await this.hideChild()
        await this.showChild(child)
    }


    createBubble(shown) {
        this.bubble = new MessageBubble(this.side, this.showPressSpace, this.hidePressSpace)
        this.bubble.hidden = !shown
        this.bubble.style.opacity = shown ? 1 : 0
        this.appendChild(this.bubble)
    }
}


class MessageBubble extends HTMLElement {
    constructor(side, showPressSpace, hidePressSpace) {
        super()
        this.className = (side === Side.LEFT ? 'left' : 'right')
        this.bubble = document.createElement('div')
        this.bubble.className = 'bubble'
        this.appendChild(this.bubble)

        this.textContainer = document.createElement('div')
        this.textContainer.className = 'text-container'
        this.bubble.appendChild(this.textContainer)

        this.showPressSpace = showPressSpace
        this.hidePressSpace = hidePressSpace

        this.textParagraph = document.createElement('p')
        this.textContainer.appendChild(this.textParagraph)

        document.addEventListener('keyup', e => this.spacePressed(e))
    }

    async sleep(time) {
        return new Promise(res => setTimeout(res, time))
    }

    async showText(txt) {
        this.textParagraph.innerText = ''
        await this.show()

        let addSpace = false
        let currSpan = null

        const addChar = char => {
            const c = addSpace ? ` ${char}` : char
            if (currSpan) {
                currSpan.appendChild(document.createTextNode(c))
            } else {
                this.textParagraph.appendChild(document.createTextNode(c))
            }
            addSpace = false
        }

        const startUsername = () => {
            currSpan = document.createElement('span')
            this.textParagraph.appendChild(currSpan)

            if (addSpace) {
                this.textParagraph.insertBefore(document.createTextNode(' '), currSpan)
                addSpace = false
            }
        }

        const endUsername = () => {
            currSpan.className = 'username'
            currSpan = null
        }

        for (const char of txt) {
            switch (char) {
                case ' ':
                    addSpace = true
                    break

                case '<':
                    startUsername()
                    break

                case '>':
                    endUsername()
                    break
                    
                default:
                    addChar(char)
            }

            const timeout = Math.random() * 100 + 25
            await this.sleep(timeout)
        }

        this.showPressSpace()

        await new Promise(res => {
            this.spaceRes = res
        })

        await this.hide()
    }

    getShowHideParams() {
        return {
            duration: 300,
            fill: 'forwards',
            easing: 'ease'
        }
    }

    async show() {
        this.hidden = false
        await this.sleep(50)
        return new Promise(res => {
            const animation = this.animate([
                { opacity: 1 }
            ], this.getShowHideParams())
            animation.onfinish = res
        })
    }

    hide() {
        return new Promise(res => {
            const animation = this.animate([
                { opacity: 0 }
            ], this.getShowHideParams())
            animation.onfinish = () => {
                this.hidden = true
                res()
            }
        })
    }

    async spacePressed(e) {
        if (e.code === 'Space') {
            if (!this.spaceRes) { return }
            e.stopPropagation()
            await (this.hidePressSpace())
            const res = this.spaceRes
            this.spaceRes = null
            res()
        }
    }
}


class PressSpace extends HTMLElement {
    constructor() {
        super()

        this.p = document.createElement('p')
        this.p.appendChild(document.createTextNode('Press '))

        this.space = document.createElement('span')
        this.space.appendChild(document.createTextNode('space'))
        this.p.appendChild(this.space)
        this.p.appendChild(document.createTextNode(' to continue...'))

        this.style.opacity = 0
        this.appendChild(this.p)
    }

    getShowHideParams() {
        return {
            duration: 300,
            fill: 'forwards',
            easing: 'ease'
        }
    }

    async show() {
        const animation = this.animate([
            { opacity: 1 }
        ], this.getShowHideParams())

        return new Promise(res => animation.onfinish = res)
    }

    hide() {
        const animation = this.animate([
            { opacity: 0 }
        ], this.getShowHideParams())

        return new Promise(res => animation.onfinish = res)
    }
}


customElements.define('character-dialog', CharacterDialog)
customElements.define('bottom-aligned-row', BottomAlignedRow)
customElements.define('character-container', CharacterContainer)
customElements.define('message-bubble', MessageBubble)
customElements.define('press-space', PressSpace)

export default CharacterDialog
