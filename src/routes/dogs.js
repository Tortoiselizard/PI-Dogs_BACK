require('dotenv').config()
const {Router} = require("express")
const request = require("request-promise")
const {Dog, Temperament} =require("../db")
const {Op} = require("sequelize")
const {YOUR_API_KEY} = process.env

const router = Router()

let idDog = 1
const regNumber = /[^0-9-.– ]/

router.post("/", async(req, res) => {
    const {name, height, weight, life_span, image, temperaments} = req.body
    // console.log(name, height, weight)
    // console.log(typeof(name), typeof(height), typeof(weight))
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
        console.log("entre en error servidor")
        res.status(400).json(error.message)
    }
})

router.get("/", async (req, res) => {
    const {name, location} = req.query
    const RUTA = `https://api.thedogapi.com/v1/breeds?api_key=${YOUR_API_KEY}`
    let dogsArrayApi = []
    let dogsArrayDB = []
    try {
        if (location === "API" || location === undefined || location === "TD") {
            dogsArrayApi = await request({
                uri: RUTA,
                json: true
            }).then(data => data.map(dog => ({
                id: dog.id,
                name: dog.name,
                height: dog.height.imperial,
                weight: regNumber.test(dog.weight.imperial)?
                    dog.weight.imperial.replace(dog.weight.imperial.split("-").find(str => regNumber.test(str)).trim(), dog.weight.imperial.split("-").find(str => !regNumber.test(str)).trim())
                    :
                    dog.weight.imperial,
                // weight: dog.weight.imperial,
                life_span: dog.life_span,
                temperament: dog.temperament,
                image: dog.image.url
            }))).catch(error => {throw new Error("Ha ocurrido un problema en el enlace con el servidor de la API")})
        }
        // console.log()
        if (location === "DB" || location === undefined || location === "TD") {
                dogsArrayDB = (await Dog.findAll({
                attributes: {exclude: ["createdAt", "updatedAt"]},
                include: Temperament
            }).catch(error => { throw new Error("Ha ocurrido un problema en el enlace con la Base de Datos del servidor")}))
            dogsArrayDB = dogsArrayDB.map(dog => ({...dog.dataValues, 
                temperament: dog.temperaments.map(t => t.dataValues.name).join(", ")
            }))
        }
       
        const dogsArray = [...dogsArrayApi, ...dogsArrayDB]
        // if (!dogsArray.length) {
        //     console.log("Esto es antes de enviar el nuevo error")    
        //     throw new Error("este es el nuevo error")
        // }
        if (name) {
            var arrayDogs = await dogsArray.filter(dog => {
                if (dog.name.toLowerCase().includes(name.toLowerCase())) return true
            })
            if (!arrayDogs.length) return res.status(201).json(`No se ha encontrado ninguna raza de perro con el nombre "${name}"`)
        }
        else {
            var arrayDogs = dogsArray
        }  
        res.status(200).send(arrayDogs)
    }
    catch(error) {
        // console.log("entre en el catch del servidor con", error)
        res.status(400).json(error.message)
    }
})

router.get("/:raza_perro", async(req, res) => {
    let {raza_perro} = req.params
    raza_perro = raza_perro.trim()
    const RUTA = `https://api.thedogapi.com/v1/breeds/search?q=${raza_perro}&api_key=${YOUR_API_KEY}`
    try {    
        dogFindedAPI = await request({
            uri: RUTA,
            json: true
        })
        .then(data => {
            if (data.length) {return {
                id: data[0].id,
                name: data[0].name,
                height: data[0].height.metric,
                weight: data[0].weight.metric,
                life_span: data[0].life_span,
                temperament: data[0].temperament,
                // origin: data[0].origin,
                // breed_group: data[0].breed_group,
                image: `https://cdn2.thedogapi.com/images/${data[0].reference_image_id}.jpg`
                }
            } else {
                return null
            }
        })
        .catch(() => {throw new Error("Ha ocurrido un problema en el enlace con el servidor de la API")})
        if (dogFindedAPI) {return res.status(200).send(dogFindedAPI)}
        var dogFindedDB = (await Dog.findOne({
            where: {name: raza_perro.includes(" ")?
                raza_perro.split(" ").map(nombre => nombre[0].toUpperCase() + nombre.slice(1).toLowerCase()).join(" "):
                raza_perro[0].toUpperCase() + raza_perro.slice(1).toLowerCase()},
            attributes: {exclude: ["createdAt", "updatedAt"]},
            include: Temperament
        }).catch(() => {throw new Error("Ha ocurrido un problema en el enlace con la base de datos de la aplicación")}))
        console.log(dogFindedDB)
        if (!dogFindedDB) {return res.status(202).send(`No se ha encontrado la raza de perro "${raza_perro}"`)}
        
        dogFindedDB = {...dogFindedDB.dataValues, 
            temperaments: dogFindedDB.temperaments.map(t => t.dataValues.name).join(", ")
        }
        return res.status(200).send(dogFindedDB)      
    }
    catch(error) {
        res.status(400).send(error.message)
    }
})

module.exports=router