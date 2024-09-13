import 'dotenv/config'

import express from 'express'
import morgan from 'morgan'
import { Person } from './model/phonebook.js'




const PORT = process.env.PORT || 3001
const app = express()
//app.use(morgan('tiny'))
app.use(morgan(function (tokens, req, res) {
  const method = tokens.method(req, res)
  return [
    method,
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    method === 'POST' ? JSON.stringify(req.body) : null
  ].join(' ')
}))
app.use(express.json())
app.use(express.static('dist'))
app.get('/',(request,response)=>{
  response.send("<h1>Phonebook</h1>")
})

app.get('/api/persons',(request,response)=>{
  Person.find({}).then(persons=>{
    persons.forEach(person=>{
      console.log(`${person.name} ${person.number}`)
    })
    response.json(persons)
    //mongoose.connection.close()
  })
  
})

app.get('/api/persons/:id',(request,response)=>{
  const id = request.params.id
  Person.findById(id).then(person => {
    if(person ===null){
      response.sendStatus(404)
      return
    }
    response.json(person)
    return
  })
})

app.get('/info',(request,response)=>{
  const date = (new Date()).toString()
  Person.find({}).then(result=>{
    response.send(`<div><p>Phonebook has info for ${result.length} people</p><p>${date}</p></div>`)
    return;
  })
})

app.delete('/api/persons/:id',(request,response)=>{
  const id = request.params.id
  Person.findById(id).then(person => {
    if(person ===null){
      response.status(404).send(`Deletion of person with id:${id} failed as that person does not exist`)
      return
    }
    Person.deleteOne({_id:id}).then((result)=>{
      console.log("RESULT",result)
      response.status(204).send(result)
      return
    })  
  })
})
 
app.post('/api/persons',(request,response)=>{
  const data = request.body
  if(!data.name || !data.number){
    //422 : Unprocessable Entity 
    response.status(422).send({error:'name and number must be provided'})
    return
  }
  Person.findOne({name:data.name}).then(foundPerson => {
    if(foundPerson){
      //409: Conflict 
      response.status(409).send({error:`Person with name ${data.name} already exists`})
      return
    }
    const person = new Person({
      name:data.name,
      number:data.number
    })
    person.save().then(person=>response.json(person))    
  })
  
})

const unknownEndpoint = (request,response)=>{
  response.status(404).send({error:'unknown endpoint'})
}
app.use(unknownEndpoint)

app.listen(PORT,()=>{
  console.log("Started our app on port: " + PORT)
})