require('dotenv').config()
const {Router, response} = require("express")
const request = require("request-promise")
const {Dog, Temperament} =require("../db")
const {Op} = require("sequelize")
const {YOUR_API_KEY} = process.env

const router = Router()
let idDog

async function updateIdDog () {
    const dogs = await Dog.findAll()
    if (!dogs.length) {
        idDog = 1
    }else {
        idDog = Number(dogs.reduce((acc,cur) => {
            return acc <= cur.dataValues.id[0]? cur.dataValues.id[0]: acc
        }, dogs[0].dataValues.id[0])) +1
    }
}
updateIdDog()

const regNumber = /[^0-9-.– ]/

router.post("/", async(req, res) => {
    const {name, height, weight, life_span, image, temperaments} = req.body
    try {
        if (name && height && weight) {
            const dog = await Dog.findAll({where: {name}})
            if (dog.length) throw new Error(`El nombre de raza ${name} ya existe`)
            if (temperaments) {
                for (let t of temperaments) {
                    const temp = await Temperament.findAll({where: {id:Number(t)}})
                    if (!temp.length) throw new Error(`El temperamento ${t} no existe`)
                }
            }
            const newDog = await Dog.create({id: idDog++, ...req.body})
            await newDog.addTemperaments(temperaments)
            return res.status(200).send(newDog)    
        }
        else {
            throw new Error("Los atributos: name, height y weight no pueden ser nulos")
        }
    } catch(error) {
        res.status(400).json(error.message)
    }
})

router.put("/", async(req,res) => {
    const {id, name, height, weight, life_span, image, temperaments} = req.body
    const objectDogProperties = {
        name, height, weight, life_span, image
    }
    try {
        const dogUpdate = await Dog.update(
            objectDogProperties,
            {where: {id}}
        ).then(async(response) => {
            if (Array.isArray(temperaments) && temperaments.length) {
                const dog = await Dog.findOne({where: {id}})
                await dog.setTemperaments(temperaments)
            }
            res.status(200).send("El perro se ha modificado exitosamente")})
        .catch(error => console.error("Error", error))
    }
    catch(error) {
        res.status(400).json(error.message)
    }
})

router.get("/", async (req, res) => {
    const {name, location} = req.query
    const RUTA = `https://api.thedogapi.com/v1/breeds?api_key=${YOUR_API_KEY}`
    let dogsApi = []
    let dogsDB = []
    try {
        if (location === "API" || location === undefined) {
            dogsApi = await request({
                uri: RUTA,
                json: true
            })
                .then(data => {
                    if (!name) {return data}
                    return data.filter(dog => {
                    return dog.name.toLowerCase().includes(name.toLowerCase())
                })})
                .then(dog => dog.map(dog => ({
                    id: dog.id,
                    name: dog.name,
                    breed_group: dog.breed_group,
                    life_span: dog.life_span,
                    temperament: dog.temperament,
                    image: dog.image.url,
                    weight: dog.weight.imperial,
                    height: dog.height.imperial
                })))
                .catch(error => {throw new Error("Ha ocurrido un problema en el enlace con el servidor de la API")})
        }
        if (location === "DB" || location === undefined) {
            dogsDB = await Dog.findAll({
                where: {
                    name: {
                        [Op.like]:  `%${name || ""}%`
                    }
                },
                attributes: {exclude: ["createdAt", "updatedAt"]},
                include: Temperament
            })
                .catch(error => { throw new Error("Ha ocurrido un problema en el enlace con la Base de Datos del servidor")})
            dogsDB = dogsDB.map(dog => ({...dog.dataValues, temperaments: dog.temperaments.map(t => t.dataValues.name).join(", ")}))
        }
        const dogsArray = [...dogsApi, ...dogsDB]
        res.status(200).send(dogsArray)
    }
    catch(error) {
        res.status(400).json(error.message)
    }
})

router.get("/:raza_perro", async(req, res) => {
    let {raza_perro} = req.params
    raza_perro = raza_perro.trim()
    // raza_perro = raza_perro.includes(" ")?
    //     raza_perro.split(" ").map(nombre => nombre[0].toUpperCase() + nombre.slice(1).toLowerCase()).join(" "):
    //     raza_perro[0].toUpperCase() + raza_perro.slice(1).toLowerCase()
    const RUTA = `https://api.thedogapi.com/v1/breeds/search?q=${raza_perro}&api_key=${YOUR_API_KEY}`
    try {    
        dogFindedAPI = await request({
            uri: RUTA,
            json: true
        })
        .then(data => {
            if (data.length) {return data.map(dog => ({
                id: dog.id,
                name: dog.name,
                height: dog.height.imperial,
                weight: dog.weight.imperial,
                life_span: dog.life_span,
                temperament: dog.temperament,
                // origin: dog.origin,
                // breed_group: dog.breed_group,
                image: dog.reference_image_id && `https://cdn2.thedogapi.com/images/${dog.reference_image_id}.jpg`
                }))
            } else {
                return null
            }
        })
        .catch(() => {throw new Error("Ha ocurrido un problema en el enlace con el servidor de la API")})
        // if (dogFindedAPI) {return res.status(200).send(dogFindedAPI)}
        var dogFindedDB = (await Dog.findAll({
            where: {
                name: {
                    [Op.like]:  `%${raza_perro}%`
                }
            },
            attributes: {exclude: ["createdAt", "updatedAt"]},
            include: Temperament
        }).catch(() => {throw new Error("Ha ocurrido un problema en el enlace con la base de datos de la aplicación")}))
        // var dogFindedDB = (await Dog.findAll().catch(() => {throw new Error("Ha ocurrido un problema en el enlace con la base de datos de la aplicación")}))
        const totalDogsFinded = [...dogFindedAPI, ...dogFindedDB].filter(dog => {
            return typeof(dog.image)==="string"})
        return res.status(200).send(totalDogsFinded)
        // if (!dogFindedDB) {return res.status(202).send(`No se ha encontrado la raza de perro "${raza_perro}"`)}
        
        // dogFindedDB = {...dogFindedDB.dataValues, 
        //     temperaments: dogFindedDB.temperaments.map(t => t.dataValues.name).join(", ")
        // }
        // return res.status(200).send(dogFindedDB)      
    }
    catch(error) {
        res.status(400).send(error.message)
    }
})

router.delete("/", async(req, res) => {
    const {id} = req.query
    await Dog.destroy({
        where: {id}
    })
        .then(response => {
            if (response === 0) {
                return res.status(200).send(`No existe un perro con el id: ${id}`)    
            }
            else if (response > 0) {
                return res.status(200).send(`El perro fue eliminado exitosamente`)
            }
        })
        .catch(error => {console.error("Error", error)})
})

module.exports=router