import './jokesScreen.css'

import CenterContent from './centerContent.js'


class JokesScreen extends HTMLElement {
    constructor() {
        super()

        this.options = new JokesOptions(joke => this.showJoke(joke), () => this.hideJoke())
        this.centered = new CenterContent(this.options)
        this.appendChild(this.centered)
    }


    showJoke(joke) {
        if (!this.jokeDisplay) {
            this.jokeDisplay = new JokeDisplay(joke)
            this.centered.insertBefore(this.jokeDisplay, this.options)
        } else {
            this.jokeDisplay.setJoke(joke)
        }
    }

    hideJoke() {
        this.jokeDisplay && this.centered.removeChild(this.jokeDisplay)
        this.jokeDisplay = null
    }
}


class JokesOptions extends HTMLElement {
    constructor(showJoke, hideJoke) {
        super()

        this.loading = document.createElement('p')
        this.loading.innerText = 'loading...'
        this.appendChild(this.loading)

        this.showJoke = showJoke
        this.hideJoke = hideJoke

        this.initialiseUI()
    }

    async initialiseUI() {
        try {
            const infoRes = await fetch('https://v2.jokeapi.dev/info')
            if (!infoRes.ok) {
                throw new Error(`Response not OK - status code ${infoRes.status}`)
            }

            const info = await infoRes.json()

            if (info.error) {
                this.handleErrorWithMessage(`Error reported by API: "${info.message}`)
                return
            }

            this.fullJokeInfo = info
            this.jokeCategories = info.jokes.categories
            this.jokeFlags = info.jokes.flags
            this.jokeLangs = Object.keys(info.jokes.idRange)
            this.jokeTypes = info.jokes.types
        } catch(e) {
            this.handleErrorWithMessage(`Error setting up: "${e.message}"`)
        }

        this.createOptions()
    }

    createOptions() {
        this.loading && this.removeChild(this.loading)
        this.loading = null
        this.languageDropdown = new JokesDropdown('language', 'Language: ', this.jokeLangs)
        this.appendChild(this.languageDropdown)

        this.categoryDropdown = new JokesDropdown('category', 'Category: ', this.jokeCategories)
        this.appendChild(this.categoryDropdown)

        this.typeDropdown = new JokesDropdown('type', 'Type: ', this.getTypeOptions())
        this.appendChild(this.typeDropdown)

        this.safeModeToggle = new JokesToggle('safe-mode', 'Safe Mode: ')
        this.appendChild(this.safeModeToggle)

        this.getJokeButton = new JokesButton('Get Joke', () => this.getJoke())
        this.appendChild(this.getJokeButton)

        const credits = document.createElement('p')
        credits.innerHTML = 'All jokes courtesy of <a target="_" href="https://jokeapi.dev/">JokeAPI.dev</a>'
        this.appendChild(credits)
    }

    handleErrorWithMessage(message) {
        this.hideJoke()
        this.error && this.removeChild(this.error)
        this.error = new JokesError(message)
        this.loading && this.removeChild(this.loading)
        this.loading = null
        this.appendChild(this.error)
    }

    getTypeOptions() {
        this.jokeTypes.splice(0, 0, 'Both')
        return this.jokeTypes.map(type => {
            if (type === 'twopart') { return 'Two Part' }
            return this.capitalized(type)
        })
    }

    buildJokeURL() {
        const baseURL = 'https://v2.jokeapi.dev/joke'
        const endpoint = this.categoryDropdown.getCurrentValue()
        const params = this.buildJokeUrlParams()

        return `${baseURL}/${endpoint}?${params}`
    }

    buildJokeUrlParams() {
        const lang = `lang=${this.languageDropdown.getCurrentValue()}`
        const type = this.getSelectedJokeTypeString()
        const safe = this.safeModeToggle.isOn() ? 'safe-mode' : ''

        const params = [lang, type, safe]
        return params.filter(el => el).join('&')
    }

    getSelectedJokeTypeString() {
        const type = this.typeDropdown.getCurrentValue()
        if (type === 'both') { return '' }

        return `type=${type.replace(/ /g, '').toLowerCase()}`
    }

    async getJoke() {
        const url = this.buildJokeURL()
        try {
            const res = await fetch(url)
            const joke = await res.json()
            
            if (joke.error) {
                this.handleErrorWithMessage(`Joke error: ${joke.message}`)
                return
            }

            this.error && this.removeChild(this.error)
            this.error = null
            this.showJoke(joke)
        } catch (e) {
            this.handleErrorWithMessage(`Error getting joke: "${e.message}"`)
        }
    }

    capitalized(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }
}


class JokesError extends HTMLElement {
    constructor(errorMessage) {
        super()

        const p = document.createElement('p')
        p.innerText = errorMessage
        this.appendChild(p)
    }
}


class JokesDropdown extends HTMLElement {
    constructor(name, label, options) {
        super()
        console.assert(name, 'Missing dropdown name')
        console.assert(label, 'Missing dropdown label')
        console.assert(options, 'Missing dropdown options')
        if (!name || !label || !options) { return }

        this.label = document.createElement('label')
        this.label.setAttribute('for', name)
        this.label.innerText = label
        this.appendChild(this.label)

        this.select = document.createElement('select')
        this.select.name = name
        this.select.id = name
        this.appendChild(this.select)

        this.addOptions(options)
    }

    addOptions(options) {
        this.select.innerText = ''
        for (const option of options) {
            const el = document.createElement('option')
            el.value = option.toLowerCase()
            el.innerText = option
            if (option === 'en') { el.selected = true }
            this.select.appendChild(el)
        }
    }

    getCurrentValue() {
        return this.select.options[this.select.selectedIndex].value
    }
}


class JokesToggle extends HTMLElement {
    constructor(name, label) {
        super()
        console.assert(name, 'Missing toggle name')
        console.assert(label, 'Missing toggle label')
        if (!name || !label) { return }

        this.label = document.createElement('label')
        this.label.setAttribute('for', name)
        this.label.innerText = label
        this.appendChild(this.label)

        this.toggle = document.createElement('input')
        this.toggle.type = 'checkbox'
        this.toggle.name = name
        this.toggle.id = name
        this.appendChild(this.toggle)
    }

    isOn() {
        return this.toggle.checked
    }
}


class JokesButton extends HTMLElement {
    constructor(label, onPressed) {
        super()
        console.assert(label, 'Missing button label')
        console.assert(onPressed, 'Missing button onPressed')
        if (!label || !onPressed) { return }

        this.button = document.createElement('button')
        this.button.innerText = label
        this.button.onclick = onPressed
        this.appendChild(this.button)
    }
}


class JokeDisplay extends HTMLElement {
    constructor(joke) {
        super()
        this.p = document.createElement('p')
        this.setJoke(joke)
        this.appendChild(this.p)
    }

    setJoke(joke) {
        console.log(joke)
        if (joke.type === 'single') {
            this.p.innerText = joke.joke
        } else {
            this.p.innerHTML = joke.setup + '<hr />' + joke.delivery
        }
    }
}


customElements.define('jokes-screen', JokesScreen)
customElements.define('jokes-options', JokesOptions)
customElements.define('jokes-error', JokesError)
customElements.define('jokes-dropdown', JokesDropdown)
customElements.define('jokes-toggle', JokesToggle)
customElements.define('jokes-button', JokesButton)
customElements.define('joke-display', JokeDisplay)

export default JokesScreen
