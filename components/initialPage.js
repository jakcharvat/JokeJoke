import CenterContent from './centerContent.js'
import CharacterDialog from './characterDialog.js'
import './initialPage.css'
import Typewriter from './typewriter.js'


class InitialPage extends HTMLElement {
    constructor(onFinished) {
        super()

        this.characterDialog = new CharacterDialog()

        const string = 'A physicist, \na mathematician \nand a programmer \nwalk into a bar...'
        this.typewriter = new Typewriter(string, { 
            onstarttyping: () => {
                this.characterDialog.onStartTyping()
            },
            onstoptyping: () => {
                this.characterDialog.onStopTyping()
            },
            onfinished: async () => {
                await this.characterDialog.runScript()
            },
            onhidden: onFinished
        })
        const centered = new CenterContent(this.typewriter)
        this.appendChild(centered)

        this.appendChild(this.characterDialog)
    }
}


customElements.define('initial-page', InitialPage)

export default InitialPage
