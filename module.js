const mongoose = require("mongoose")
mongoose.connect("")
//schema and module
const userSchema = mongoose.Schema({
    username: String,
    password: String
})
const organisationSchema = mongoose.Schema({
        name: String,
        title:String,
        description:String,
        admin: [mongoose.Types.ObjectId],
        members: [mongoose.Types.ObjectId],
})
const organisationmodule = mongoose.model("organisation",organisationSchema)
const usermodule = mongoose.model("user",userSchema)
module.exports = {
   organisationmodule,
   usermodule 
}