import mongoose from 'mongoose'
const url = process.env.MONGODB_URI
mongoose.set('strictQuery',false)
mongoose.connect(url).then(() => {
  console.log('connected to MongoDB')
})
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  name: {
    type:String,
    minLength:3,
    required:true
  },
  number: {
    type:String,
    minLength:8,
    validate:{
      validator:(val) => {
        //Find the -, check if left part has two or three numbers,
        // and if right part has numbers
        const index = val.indexOf('-')
        if( index === -1 || ( index!== 2 && index !== 3) ) return false
        return (!isNaN(val.substring(0,index)) && !isNaN(val.substring(index + 1)))
      }
    },
    required:true
  },
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Person = mongoose.model('Person', personSchema)

export { Person }

