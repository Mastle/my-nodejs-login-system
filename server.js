if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

//current step: study express.js, bcrypt (so what is exactly different from a session with a user that's logged in and a session for a non-registered user?)
//next step: clean up the code, move the prisma (I could really use a better app architecture for express.js apps)
//next step: expand the funtionalities, turn into a full fledged API
//TODO: also, the code could use some cleaning up


const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const { addUser, getUserByEmail, getUserByID } = require('./prisma/prismaMethods')
const initializePassport = require('./passport-config')
initializePassport(
  passport,
  async email => await getUserByEmail(email),
  async id => await getUserByID(id)

)



app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static('dist'))

app.get('/', checkAuthenticated, async (req, res) => {
  res.render('index.ejs', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {

  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('register.ejs')
})


app.post('/register', checkNotAuthenticated, async (req, res) => {
  try {

    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const name = req.body.name
    const email = req.body.email
    const password = hashedPassword
    addUser(name, email, password)
      .catch(e => { console.error(e.message) })
      .finally(async () => { await prisma.$disconnect() })
    res.redirect('/login')
  } catch {
    res.redirect('/register')
  }
})

app.delete('/logout', (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err)
    }
  })
  res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  } else
    res.redirect('/login')

}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}




app.listen(3002)

