require('dotenv').config()
const { Router } = require('express')
const request = require('request-promise')
const { Dog, Temperament } = require('../db')
const { Op } = require('sequelize')
const { YOUR_API_KEY } = process.env

const router = Router()

router.post('/', async (req, res) => {
  const { name, height, weight, temperaments } = req.body
  try {
    if (name && height && weight) {
      const dog = await Dog.findAll({ where: { name } })
        .catch(error => { throw new Error(error.message) })
      if (dog.length) throw new Error(`El nombre de raza ${name} ya existe`)
      if (temperaments.length) {
        for (const t of temperaments) {
          const temp = await Temperament.findAll({ where: { id: Number(t) } })
            .catch(error => { throw new Error(error.message) })
          if (!temp.length) throw new Error(`El temperamento ${t} no existe`)
        }
      }
      const newDog = await Dog.create({ ...req.body })
        .catch(error => { throw new Error(error.message) })
      await newDog.addTemperaments(temperaments)
        .catch(error => { throw new Error(error.message) })
      return res.status(200).send(newDog)
    } else {
      throw new Error('Los atributos: name, height y weight no pueden ser nulos')
    }
  } catch (error) {
    res.status(400).json(error.message)
  }
})

router.put('/', async (req, res) => {
  const { id, name, height, weight, lifeSpan, image, temperaments } = req.body
  const objectDogProperties = {
    name, height, weight, lifeSpan, image
  }
  const numberId = Number(id.slice(0, id.indexOf('db')))
  try {
    await Dog.update(
      objectDogProperties,
      { where: { id: numberId } }
    ).then(async () => {
      if (Array.isArray(temperaments) && temperaments.length) {
        const dog = await Dog.findOne({ where: { id: numberId } })
        await dog.setTemperaments(temperaments)
      }
      res.status(200).send('El perro se ha modificado exitosamente')
    })
      .catch(error => { throw new Error(error.message) })
  } catch (error) {
    res.status(400).json(error.message)
  }
})

router.get('/', async (req, res) => {
  const { name, location } = req.query
  const RUTA = `https://api.thedogapi.com/v1/breeds?api_key=${YOUR_API_KEY}`
  let dogsApi = []
  let dogsDB = []
  try {
    if (location === 'API' || location === undefined) {
      dogsApi = await request({
        uri: RUTA,
        json: true
      })
        .then(data => {
          if (!name) { return data }
          return data.filter(dog => {
            return dog.name.toLowerCase().includes(name.toLowerCase())
          })
        })
        .then(dog => dog.map(dog => ({
          id: dog.id,
          name: dog.name,
          breed_group: dog.breed_group,
          lifeSpan: dog.lifeSpan,
          temperament: dog.temperament,
          image: dog.image.url,
          weight: dog.weight.imperial,
          height: dog.height.imperial
        })))
        .catch(error => { throw new Error(error.message) })
    }
    if (location === 'DB' || location === undefined) {
      dogsDB = await Dog.findAll({
        where: {
          name: {
            [Op.like]: `%${(name && name[0].toUpperCase() + name.slice(1).toLowerCase()) || ''}%`
          },
          image: {
            [Op.ne]: '',
            [Op.not]: 'true'
          }
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: Temperament
      })
        .then(listDogs => listDogs.map(dog => ({
          id: `${dog.id}db`,
          name: dog.name,
          height: dog.height,
          weight: dog.weight,
          lifeSpan: dog.lifeSpan,
          image: dog.image,
          temperament: dog.temperaments.map(t => t.dataValues.name).join(', ')
        })))
        .catch(error => { throw new Error(error.message) })
    }
    const dogsArray = [...dogsApi, ...dogsDB]
    res.status(200).send(dogsArray)
  } catch (error) {
    res.status(400).json(error.message)
  }
})

router.get('/:razaPerro', async (req, res) => {
  let { razaPerro } = req.params
  razaPerro = razaPerro.trim()
  const RUTA = `https://api.thedogapi.com/v1/breeds/search?q=${razaPerro}&api_key=${YOUR_API_KEY}`
  try {
    let dogFinded = await request({
      uri: RUTA,
      json: true
    })
      .then(data => {
        if (data.length) {
          return data.map(dog => ({
            id: dog.id,
            name: dog.name,
            height: dog.height.imperial,
            weight: dog.weight.imperial,
            lifeSpan: dog.life_span,
            temperament: dog.temperament,
            image: dog.reference_image_id && `https://cdn2.thedogapi.com/images/${dog.reference_image_id}.jpg`
          }))
        } else {
          return null
        }
      })
      .catch((error) => { throw new Error(error.message) })
    if (!dogFinded || !dogFinded[0].image) {
      dogFinded = (await Dog.findAll({
        where: {
          name: {
            [Op.like]: `%${razaPerro}%`
          }
        },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: Temperament
      })
        .then(listDogs => listDogs.length
          ? listDogs.map(dog => ({
            id: `${dog.id}db`,
            name: dog.name,
            height: dog.height,
            weight: dog.weight,
            lifeSpan: dog.lifeSpan,
            image: dog.image,
            temperament: dog.temperaments.map(t => t.dataValues.name).join(', ')
          }))
          : null)
        .catch(error => { throw new Error(error.message) }))
    }
    if (!dogFinded || !dogFinded[0].image) throw new Error(`La raza de perro ${razaPerro} no está en la base de datos`)
    return res.status(200).send(dogFinded)
  } catch (error) {
    res.status(400).send(error.message)
  }
})

router.delete('/', async (req, res) => {
  const { id } = req.query
  const numberId = Number(id.slice(0, id.indexOf('db')))
  try {
    await Dog.destroy({
      where: { id: numberId }
    })
      .then(response => {
        if (response === 0) {
          return res.status(200).send(`No existe un perro con el id: ${id}`)
        } else if (response > 0) {
          return res.status(200).send('El perro fue eliminado exitosamente')
        }
      })
      .catch(error => { throw new Error(error.message) })
  } catch (error) {
    res.status(400).send(error.message)
  }
})

module.exports = router
