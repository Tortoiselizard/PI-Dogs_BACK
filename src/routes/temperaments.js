require('dotenv').config()
const {Router} = require("express")
const {Temperament} =require("../db")
const request = require("request-promise")
const {YOUR_API_KEY} = process.env

const router = Router()

router.get("/", async (req, res) => {

    try {
        const temperamentsArrayDB = await Temperament.findAll()
        .catch(error => {throw new Error("Ha ocurrido un error en el enlace con la base de datos")})
        res.status(200).send(temperamentsArrayDB)      
    } catch(error) {
        res.status(400).json(error.message)
    }
})

router.post("/", async (req, res) => {
    const RUTA = `https://api.thedogapi.com/v1/breeds?api_key=${YOUR_API_KEY}`
    const {add} = req.query
    
    const temperamentsArrayDB = await Temperament.findAll()
    const arrayTemperaments = temperamentsArrayDB.map(temperament => temperament.name)
    let newTemperaments = []
    
    try {
        if (add === "update") {
            const dogsArrayAPI = await request({
                uri: RUTA,
                json: true
            }).then(data => data)
            .catch(error => {throw new Error("Ha ocurrido un problema con el enlace al servidor de la API")})
        
            dogsArrayAPI.forEach(async (dog) => {
                dog.temperament && dog.temperament.split(", ").forEach(temperament => {
                    !arrayTemperaments.includes(temperament)? newTemperaments.push({name: temperament}):null
                })
            })
        }
        if (add === "add") {
            req.body.forEach(temperament => {
                !arrayTemperaments.includes(temperament)? newTemperaments.push({name: temperament}):null
            })
        }
        const newTemperamentsToCreate = await Temperament.bulkCreate(newTemperaments)
        res.status(200).json(newTemperamentsToCreate)
    }
    catch(error) {
        res.status(400).json(error.message)
    }
})

module.exports=router