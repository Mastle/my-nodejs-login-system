//Must use Postgres as the backend. If I fail at any part, I'll watch the video
//Current step: So it looks like that fisrt of all, I'll add the prisma client here

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}



const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const initializePassport = require('./passport-config')
initializePassport(
  passport,
  email => users.find(user => user.email === email), //Is this where I should call the prisma functions that returns the user's email from the database?
  id => users.find(user => user.id === id)
)

const users = []

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

app.get('/', checkAuthenticated, (req, res) => {
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
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
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


async function prismaMain() {
  const user = await prisma.user.findFirst({ where: { name: 'test user', email: 'coolmail@ymail.com', password: '1022test' } })
  console.log(user)
}

prismaMain()
  .catch(e => {
    console.error(e.message)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


app.listen(3002)

/*

 current step: now figure out how to add the users to the database by getting them from ExpressJS
 
*/