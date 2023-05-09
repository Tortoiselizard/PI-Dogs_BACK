require('dotenv').config()
const { Router, response } = require("express")
const request = require("request-promise")
const { Dog, Temperament, User } = require("../db")
const { Op } = require("sequelize")
const { YOUR_API_KEY } = process.env

const router = Router()

router.post("/", async (req, res) => {
    const { name, email, password, image } = req.body
    try {
        if (email) {
            const user = await User.findAll({ where: { email } })
            if (user.length) throw new Error(`Ya existe una cuenta con este email`)
            const newUser = await User.create({ ...req.body, name: name || "user" })
            return res.status(200).send(newUser)
        }
        else {
            throw new Error("El email no puede ser nulo")
        }
    } catch (error) {
        res.status(400).json(error.message)
    }
})

router.put("/", async(req,res) => {
    const {name, email, password, image } = req.body
    const { id } = req.query
    try {
        const dogUpdate = await User.update(
            req.body,
            {where: {id}}
        ).then(response => {
            res.status(200).send("El usuario se ha modificado exitosamente")})
        .catch(error => res.status(400).json(error.message))
    }
    catch(error) {
        res.status(400).json(error.message)
    }
})

router.get("/", async (req, res) => {
    const { id } = req.query
    let arrayUsers
    try {
        if (!id) {
            arrayUsers = await User.findAll()
                .catch(error => { throw new Error("Ha ocurrido un problema en el enlace con la Base de Datos del servidor") })
            if (arrayUsers.length) return res.status(200).send(arrayUsers)
            return res.status(200).send("No hay usuarios en la Base de Datos del servidor")
        } else {
            user = await User.findOne({ where: { id } })
            if (user) return res.status(200).send(user)
            return res.status(200).send(`No se ha encontrado un usuario con el id: ${id}`)
        }
    }
    catch (error) {
        res.status(400).json(error.message)
    }
})

router.delete("/", async (req, res) => {
    const { id } = req.query
    try {
        if (id) {
            await User.destroy({
                where: { id }
            })
                .then(response => {
                    if (response === 0) {
                        return res.status(200).send(`No existe un usuario con el id: ${id}`)
                    }
                    else if (response > 0) {
                        return res.status(200).send(`Se han eliminado ${response} usuarios`)
                    }
                })
                .catch(error => { console.error("Error", error) })
        } else {
            return res.status(200).send(`El valor del id no puede ser nulo`)
        }
        
    } catch (error) {
        res.status(400).json(error.message)
    }

})

module.exports = router