import './centerContent.css'

class CenterContent extends HTMLElement {
    constructor(child) {
        super()
        this.appendChild(child)
    }
}


customElements.define('center-content', CenterContent)
export default CenterContent
