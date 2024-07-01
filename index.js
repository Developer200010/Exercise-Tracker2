const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL)
.then(()=> console.log("db is connected successfully"))
.catch((error)=> console.log(error.message));


app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// database

const UserSchema = mongoose.Schema({
  username:String,
});
const User = mongoose.model("user", UserSchema);

const ExerciseSchema = mongoose.Schema({
  description:String,
  duration:Number,
  date:Date,
  user_id:{
    type: String,
    required: true
  },
});
const Exercise = mongoose.model("exercise", ExerciseSchema);

// routes

app.get("/api/users", async(req,res)=>{
  const users = await User.find({}).select("_id username");
  if(!users){
    res.send("No users");
  }else(
    res.json(users)
  )
})

app.post("/api/users",async (req,res)=>{
  let{ username } = req.body;
  const userObj = new User({
    username,
  });

  try {
    const user = await userObj.save();
    res.json(user)
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/api/users/:_id/exercises",async (req,res)=>{
  const id = req.params._id;
  let { description, duration, date} = req.body;
  try {
    const user = await User.findById(id)
    if(!user){
      res.send("Could not find user");
    } else{
      const exerciseObj = new Exercise({
        description,
        duration,
        date: date ? new Date(date) : new Date(),
        user_id : user._id,
      });
      const exercise = await exerciseObj.save();
      res.json({
        username: user.username,
        description: exercise.description,
        duration: new Date(exercise.date).toDateString(),
        _id: user._id,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.send("There was an error saving the exercise");
  }

});


app.get("/api/users/:_id/logs", async (req,res)=>{
  let{from, to ,limit} = req.query;
  const id = req.params._id;

  const user = await User.findById(id);
  if(!user){
    res.send("Could not find user");
    return;
  }
   let dateObj = {};
   if(from){
    dateObj["$gte"] = new Date(from);
   }
   if(to){
    dateObj["$lte"] = new Date(to);
   }

   let filter = {
    user_id : id
   }

   if(from || to){
    filter.date = dateObj;
   }

   const exercises = await Exercise.find(filter).limit(limit ?? 500);

   const log = exercises.map(e =>({
    description: e.description,
    duration : e.duration,
    date: e.date.toDateString()
   }))


   res.json({
    username : user.username,
    count : exercises.length,
    _id: user._id,
    log
   })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
