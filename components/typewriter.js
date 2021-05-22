class Typewriter extends HTMLElement {
    constructor(string, { onstarttyping, onstoptyping, onfinished, onhidden }) {
        super()
        this.targetString = string
        this.targetLines = string.split('\n').map(line => line.trim())
        this.currIndex = -1
        this.speed = 150
        this.newlineDelay = 200

        this.onstarttyping = onstarttyping
        this.onstoptyping = onstoptyping
        this.onfinished = onfinished
        this.onhidden = onhidden

        this.nextCharacterLineIdx = 0
        this.nextCharacterColIdx = 0

        this.sizeRefClass = 'size-ref'
        this.hiddenRefClass = 'ref-hidden'

        this.createCursor()
        this.createSizeRef()
        this.createWriteColumn()
        this.createLineHeightRef()
        this.createLineWidthRef()

        setTimeout(() => {
            this.startTyping()
        }, this.cursor.animationDuration * 4)
    }

    createCursor() {
        this.cursor = new Cursor()
        this.appendChild(this.cursor)
    }

    createSizeRef() {
        this.sizeRef = document.createElement('p')
        this.sizeRef.className = this.sizeRefClass
        this.sizeRef.innerText = this.targetString
        this.appendChild(this.sizeRef)
    }

    createWriteColumn() {
        this.lineElements = this.targetLines.map(() => {
            const row = new Row()
            return row
        })

        const column = new Column(this.lineElements)
        column.id = 'writeColumn'
        this.appendChild(column)
    }

    createLineHeightRef() {
        this.heightRef = document.createElement('p')
        this.heightRef.innerHTML = 'The quick brown fox jumps over the lazy dog'
        this.heightRef.className = `${this.sizeRefClass} ${this.hiddenRefClass}`
        this.appendChild(this.heightRef)
    }

    createLineWidthRef() {
        this.widthRef = document.createElement('p')
        this.widthRef.innerHTML = this.targetLines[0][0]
        this.widthRef.className = `${this.sizeRefClass} ${this.hiddenRefClass}`
        this.appendChild(this.widthRef)
    }

    getLineHeight() {
        return this.lineHeight || (this.lineHeight = this.heightRef.clientHeight)
    }

    startTyping() {
        this.onstarttyping && this.onstarttyping()
        this.cursor.stopTicking()
        this.currLineString = this.widthRef.innerText
        this.type()
    }

    type() {
        const targetCursorOffsetLeft = this.widthRef.clientWidth

        const line = this.nextCharacterLineIdx
        const col = this.nextCharacterColIdx++
        const char = this.targetLines[line][col].replace(/ /g, '\u00A0')
        this.lineElements[line].appendChild(new TypewriterCharacter(char))
        this.cursor.moveTo({ left: `${targetCursorOffsetLeft + 8}px`})

        if (this.nextCharacterColIdx === this.targetLines[line].length) {
            this.nextCharacterLineIdx++
            this.nextCharacterColIdx = 0

            if (this.nextCharacterLineIdx === this.targetLines.length) {
                this.onstoptyping && this.onstoptyping()
                setTimeout(() => {
                    this.cursor.startTicking()
                    this.moveUp()
                }, 700)
                return
            }

            this.currLineString = this.targetLines[this.nextCharacterLineIdx][0]
            this.widthRef.innerText = this.currLineString

            setTimeout(() => {
                const tgtPos = { left: '3px', top: `${this.nextCharacterLineIdx * this.getLineHeight()}px` }
                this.cursor.moveTo(tgtPos, () => {
                    setTimeout(() => {
                        this.cursor.startTicking()

                        setTimeout(() => {
                            this.cursor.stopTicking()
                            this.type()
                        }, this.cursor.animationDuration)
                    }, 200)
                })
            }, 100)

            return
        }

        const nextChar = this.targetLines[line][this.nextCharacterColIdx]
        this.currLineString += (nextChar === ' ' ? '\u00A0' : nextChar)
        this.widthRef.innerText = this.currLineString

        setTimeout(() => {
            this.type()
        }, this.speed + Math.random()*100 - 50)
    }

    moveUp() {
        const availHeight = window.innerHeight
        const takenHeight = this.clientHeight
        
        const freeHeight = availHeight - takenHeight
        const topSpace = freeHeight / 2
        const paddingTop = 100
        const moveUpBy = Math.max(0, topSpace - paddingTop)

        const animation = this.animate([
            { transform: `translateY(-${moveUpBy}px)` }
        ], {
            duration: 1000,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            fill: 'forwards',
            delay: 1500
        })

        if (this.onfinished) animation.onfinish = async () => {
            await this.onfinished()
            await this.hide()
            this.onhidden && this.onhidden()
        }
    }

    async hide() {
        const animation = this.animate([
            { opacity: 0 }
        ], {
            duration: 300,
            fill: 'forwards',
            easing: 'ease'
        })

        return new Promise(res => {
            animation.onfinish = () => {
                this.parentElement.removeChild(this)
                res()
            }
        })
    }
}


/* -------------------------------------------------------------------------------------------------------- */
/*                                          TYPEWRITER TEXT ELEMENT                                         */
/* -------------------------------------------------------------------------------------------------------- */
class TypewriterCharacter extends HTMLElement {
    constructor(char) {
        super()
        const p = document.createElement('p')
        p.innerText = char
        this.appendChild(p)
    }
}


/* -------------------------------------------------------------------------------------------------------- */
/*                                                  COLUMN                                                  */
/* -------------------------------------------------------------------------------------------------------- */
class Column extends HTMLElement {
    constructor(children) {
        super()
        children.forEach(el => this.appendChild(el))
    }
}


/* -------------------------------------------------------------------------------------------------------- */
/*                                                    ROW                                                   */
/* -------------------------------------------------------------------------------------------------------- */
class Row extends HTMLElement {
    constructor(children) {
        super()
        children?.forEach(el => this.appendChild(el))
    }
}


/* -------------------------------------------------------------------------------------------------------- */
/*                                                  CURSOR                                                  */
/* -------------------------------------------------------------------------------------------------------- */
class Cursor extends HTMLElement {
    constructor() {
        super()
        this.tickSpeed = 300
        this.animationDuration = this.tickSpeed * 4
        this.startTicking()
    }

    startTicking() {
        this.showCursorAnimation?.pause()
        this.tickAnimation = this.animate([
            { opacity: 1 },
            { opacity: 0, offset: 0.1 },
            { opacity: 0, offset: 0.5 },
            { opacity: 1, offset: 0.6 },
            { opacity: 1 }
        ], {
            duration: this.animationDuration
        });
        this.showCursorAnimation?.cancel()

        this.tickAnimation.onfinish = () => this.startTicking()
    }

    stopTicking() {
        this.tickAnimation?.pause()
        this.showCursorAnimation = this.animate([
            { opacity: 1 },
        ], {
            duration: 200,
            fill: 'forwards'
        })
        this.tickAnimation?.cancel()

        this.showCursorAnimation.onfinish = () => {
            this.showCursorAnimation = null
        }
    }

    moveTo(pos, then) {
        const animation = this.animate([pos], {
            duration: pos.top ? 150 : 50,
            fill: 'forwards',
            easing: 'ease'
        })

        if (then) {
            animation.onfinish = then
        }
    }
}


/* -------------------------------------------------------------------------------------------------------- */
/*                                              CUSTOM ELEMENTS                                             */
/* -------------------------------------------------------------------------------------------------------- */
customElements.define('my-typewriter', Typewriter)
customElements.define('typewriter-cursor', Cursor)
customElements.define('typewriter-column', Column)
customElements.define('typewriter-row', Row)
customElements.define('typewriter-character', TypewriterCharacter)


/* -------------------------------------------------------------------------------------------------------- */
/*                                                  EXPORTS                                                 */
/* -------------------------------------------------------------------------------------------------------- */
export default Typewriter
