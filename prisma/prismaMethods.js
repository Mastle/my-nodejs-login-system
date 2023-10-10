const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

//adding user with prisma
async function addUser(userName, userEmail, userPassword) {
    try {
        await prisma.user.create({
            data: {
                name: userName,
                email: userEmail,
                password: userPassword
            }
        })
    } catch (e) {
        console.log(e)
    }

}



//find user by email
async function getUserByEmail(userEmail) {

    const userObj = await prisma.user.findUnique({
        where: {
            email: userEmail,
        }
    })

    return userObj

}

//find user by id
async function getUserByID(userID) {
    const userObj = await prisma.user.findUnique({
        where: {
            id: userID,
        }
    })
    return userObj

}





module.exports = {
    addUser,
    getUserByEmail,
    getUserByID
}