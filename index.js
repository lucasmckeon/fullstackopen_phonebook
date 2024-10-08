import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import { Person } from './model/phonebook.js'

const PORT = process.env.PORT || 3001
const app = express()
// app.use(morgan('tiny'))
app.use(morgan((tokens, req, res) => {
  const method = tokens.method(req, res)
  return [
    method,
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    method === 'POST' ? JSON.stringify(req.body) : null,
  ].join(' ')
}))
app.use(express.json())
app.use(express.static('dist'))
app.get('/', (request, response) => {
  response.send('<h1>Phonebook</h1>')
})

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then((persons) => {
    persons.forEach((person) => {
      console.log(`${person.name} ${person.number}`)
    })
    response.json(persons)
  }).catch((error) => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  const { id } = request.params
  Person.findById(id).then((person) => {
    if (person === null) {
      response.sendStatus(404)
      return
    }
    response.json(person)
  }).catch((error) => next(error))
})

app.get('/info', (request, response, next) => {
  const date = (new Date()).toString()
  Person.find({}).then((result) => {
    response.send(`<div><p>Phonebook has info for ${result.length} people</p><p>${date}</p></div>`)
  }).catch((error) => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  const { id } = request.params
  Person.findByIdAndDelete(id).then((result) => {
    if (result.deletedCount === 0) {
      response.status(404).end()
      return
    }
    response.status(204).send(result)
  }).catch((error) => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const data = request.body
  Person.findOne({ name: data.name }).then((foundPerson) => {
    if (foundPerson) {
      // 409: Conflict
      response.status(409).send({ error: `Person with name ${data.name} already exists` })
      return
    }
    const person = new Person({
      name: data.name,
      number: data.number,
    })
    person.save()
      .then((savedPerson) => response.json(savedPerson)).catch((error) => next(error))
  }).catch((error) => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { id } = request.params
  const { body } = request
  console.log('BODY', body)
  const person = {
    name: body.name,
    number: body.number,
  }
  Person.findByIdAndUpdate(id, person, { new: true, runValidators: true, context: 'query' })
    .then((result) => {
      response.json(result)
    }).catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } if (error.name === 'ValidationError') {
    // https://www.rfc-editor.org/rfc/rfc9110#name-422-unprocessable-content
    return response.status(422).json({ error: error.message })
  }
  next(error)
}
app.use(errorHandler)
app.listen(PORT, () => {
  console.log(`Started our app on port: ${PORT}`)
})
