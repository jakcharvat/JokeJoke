import './components/initialPage.js'
import InitialPage from './components/initialPage.js'
import JokesScreen from './components/jokesScreen.js'


const app = document.getElementById('app')
const initialPage = new InitialPage(showJokesScreen)
app.appendChild(initialPage)


function showJokesScreen() {
    app.removeChild(initialPage)
    const jokesScreen = new JokesScreen()
    app.appendChild(jokesScreen)
}


// const app = document.getElementById('app')
// const jokesScreen = new JokesScreen()
// app.appendChild(jokesScreen)