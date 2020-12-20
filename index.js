const express=require('express')
//const{findSourceMap}=require('module') -- syntax
const app=express();
const nodemailer = require("nodemailer");
require('dotenv').config();
const bcrypt= require('bcrypt');
const cors=require('cors');//to avoid blocking of data when tryin to fetch the details via api from frontend
const mongodb=require('mongodb')
const mongoClient=mongodb.MongoClient;
const cryptoRandomString = require('crypto-random-string');
//dbURL--local
//const dbURL='mongodb://127.0.0.1:27017';
const port=process.env.PORT ||4000
const dbURL= 'mongodb+srv://training-db:G0xkzKuZ5ZubrOGm@cluster0.ohd0y.mongodb.net/<dbname>?retryWrites=true&w=majority'; //dbUrl can be either from local or from cloud
//dbURL --cloud =>replace <passwor> with connection pasword :::::is copied to.env
//const dbURL='mongodb+srv://training-db:<password>@cluster0.ohd0y.mongodb.net/<dbname>?retryWrites=true&w=majority'


const objectId=mongodb.ObjectID
app.use(express.json());//used instead of bodyparser
app.use(cors());//avctivating cors pavckage
//connection pasword:: G0xkzKuZ5ZubrOGm
app.get('/',async(req,res)=>{
  try {
      let clientInfo=await mongoClient.connect(dbURL)
      let db=clientInfo.db("studentDetails");
      let data=await db.collection('users').find().toArray();
      res.status(200).json({data})
      clientInfo.close();
  } catch (error) {
      console.log(error)
      res.send(500)
  }
})
app.post('/add-user',async(req,res)=>{
    try {
        let clientInfo=await mongoClient.connect(dbURL)
        let db=clientInfo.db("studentDetails");
        let data=await db.collection('users').insertOne(req.body);
        res.status(200).json({message:"user added"})
        clientInfo.close();
       // console.log(process)
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"can't create"})
    }
})
app.get('/get-user/:id',async(req,res)=>{
    try {
        let clientInfo=await mongoClient.connect(dbURL)
        let db=clientInfo.db("studentDetails");
        let data=await db.collection('users').findOne({_id:objectId(req.params.id)});
        res.status(200).json({data})
        clientInfo.close();
    } catch (error) {
        console.log(error)
        res.send(500)
    }
})


app.delete('/delete-user/:id',async(req,res)=>{
    try {
        let clientInfo=await mongoClient.connect(dbURL)
        let db=clientInfo.db("studentDetails");
        let data=await db.collection('users').deleteOne({_id:objectId(req.params.id)});
        res.status(200).json({message:"user deleted"})
        clientInfo.close();
    } catch (error) {
        console.log(error)
        res.send(500)
    }
})
app.post('/register',async(req,res)=>{
    try {
        let clientInfo= await mongoClient.connect(dbURL);
        let db= clientInfo.db('studentDetails');
        let result=await db.collection('users').findOne({email: req.body.email});
        //console.log(req.body.email)
        if(result){
            res.status(400).json({
                status:"failed",
                message:'User already Registered'
            })
            clientInfo.close()
        }else{
            let salt=await bcrypt.genSalt(10);
            let hash=await bcrypt.hash(req.body.password,salt)
            console.log(salt);
            //console.log(password);
            req.body.password=hash;
            await db.collection("users").insertOne(req.body)
            res.status(200).json({
                status:"success",
                message:"registered"})
            clientInfo.close()
        }
    } catch (err) {
        console.log(err)        
    }
})

app.post('/login',async(req,res)=>{
    try {
        let clientInfo=await mongoClient.connect(dbURL);
        let db= clientInfo.db('studentDetails');
        let result= await db.collection('users').findOne({email:req.body.email})
        if(result){
            let isTrue = await bcrypt.compare(req.body.password,result.password)
            if(isTrue){
                res.status(200).json({
                    status:"success",
                    message:"Login Successfull"})
            }else{
                res.status(200).json({
                    status:"failed",
                    message:"Login Not SuccessFull"})
                
            }clientInfo.close()
        }else{
            res.status(400).json({
                status:"failed",
                message:"User not registered"})
            clientInfo.close()
        }
        
    } catch (error) {
        console.log(error) 
    }
})
app.post('/reset',async(req,res)=>{
    try {
        let clientInfo= await mongoClient.connect(dbURL);
        let db= clientInfo.db('studentDetails');
        let result=await db.collection('users').findOne({email: req.body.email});
        //console.log(req.body.email)
        if(result){
            mail_id=req.body.email;
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                  user: "zentestacct.2020@gmail.com", // generated ethereal user
                  pass: "welcome5zen", // generated ethereal password
                },
            });
            let random_string=cryptoRandomString({length: 20, type: 'url-safe'});

            let info = await transporter.sendMail({
                from: '"Test Account" <zentestacct.2020@gmail.com>', // sender address
                to: `${mail_id}`, // list of receivers
                subject: "Link to Reset Password", // Subject line
                html: `<b>Click the below link to reset pasword.</b><br>
                <p>https://determined-chandrasekhar-7fc9d1.netlify.app/reset.html?reset_string=${random_string},user=${req.body.email}</p>
                `, // html body
              });
              await db.collection("users").updateOne({
                email: req.body.email
            }, {
                $set: {
                    token: random_string
                }
            })
              res.status(200).json({
                  status:"success",
                  message:'Email has been sent to your account'
                })
                clientInfo.close()
            }else{
                res.status(400).json({
                    status:"failed",
                    message:"User Not registered"})
                clientInfo.close()
            }
        } catch (err) {
            console.log(err)        
        }
    })
    app.put('/update-user/:email',async(req,res)=>{
        try {
            let clientInfo=await mongoClient.connect(dbURL)
            let db=clientInfo.db("studentDetails");
            let data=await db.collection('users')
            .findOne({$and:[{email: req.body.email},
                {token:req.body.token}]});
            if(data){
                let salt=await bcrypt.genSalt(10);
                let hash=await bcrypt.hash(req.body.password,salt)
                //console.log(salt);
                //console.log(password);
               // req.body.password=hash;
                await db.collection("users")
                .updateOne({email:req.body.email},{
                    $set:{token:'',password:hash}})
                res.status(200).json({status:"success",message:"Password Updated Successfully"})
                clientInfo.close()
            }else{
                    res.status(400).json({
                        message:'Failed to reset password'
                    })
                    clientInfo.close()
            }
            // res.status(200).json({message:"user updated"})
            // clientInfo.close();
        } catch (error) {
            console.log(error)
            res.status(500).json({error})
        }
    })
  
    app.listen(port,()=>{
        console.log('Server Started')
})
