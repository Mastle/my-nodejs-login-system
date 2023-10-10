const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    const user = await getUserByEmail(email)
    if (user == null) {
      return done(null, false, { message: 'No user with that email' })
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }
  //The closest I can get to fully understanding how requests from an authenticated user are handled on a webapp:
  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser(async (id, done) => {  //1- this guy turns the session id into an object that populates req.user
    return done(null, await getUserById(id)) //2- and this prisma function is called for comparison between req.user object and the user object from the database
  })
}

module.exports = initialize

//3- So serializeUser truns user object into a string that is combined with connection/session id. It's stored in the cookies of the client.
//4- on each subsequent request, this string is converted back into a user object through desrializeUser, and then the web app compares the req.user with the user in the database by calling the getUserById function 