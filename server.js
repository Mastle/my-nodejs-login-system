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
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
  //current step (check windows note):  this is exactly the prisma search function that returns user email and id 
  //so it looks like if I give passport the user as an object through their email, I'll easily be able to access to his password as well
  //I need to do the same thing with their id's
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

//current step: So I push the data into the database here for  registeration.

//adding user with prisma
async function addUser(userName, userEmail, userPassword) {
  await prisma.user.create({
    data: {
      name: userName,
      email: userEmail,
      password: userPassword
    }
  })
}


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


// async function prismaMain() {
//   const user = await prisma.user.findFirst({ where: { name: 'test user', email: 'coolmail@ymail.com', password: '1022test' } })
//   console.log(user)
// }

// prismaMain()
//   .catch(e => {
//     console.error(e.message)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })


app.listen(3002)

