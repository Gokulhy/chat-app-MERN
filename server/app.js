const express=require('express');
const bcryptjs = require('bcryptjs');
const cors=require('cors');
const jwt=require('jsonwebtoken');
const mongoose=require('mongoose');
const io=require('socket.io')(8080,{
    cors:{
        origin: '*',
        methods: ['GET', 'POST'],
    }
})

require('./db/connection');

const Users=require('./modules/Users');
const Conversations=require('./modules/conversation');
const Messages=require('./modules/messages');
const { Socket } = require('socket.io');

const app=express();
const port=process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({extended:false}));

//cors 
app.use(cors());

app.get('/',(req,res)=>{
    res.write('welcome');
    res.end();
})

//socket.io
let users=[]
io.on('connection',socket=>{
    console.log("connected",socket.id);
    socket.on('addUser',userId=>{
        const isUserExist=users.find(user=>user.userId===userId );
        if(!isUserExist){
            const user={userId,socketId:socket.id}
            users.push(user);
            console.log("user->",userId);
            io.emit('getUsers',users);
        }
    });

    socket.on('disconnect',()=>{
        users=users.filter(user=>user.socketId!=socket.id)
        io.emit('getUsers',users);
    })
    
    socket.on('sendMessage',({conversationId,senderId,message,receiverId})=>{
        const receiver=users.find(user=>user.userId===receiverId);
        const sender=users.find(user=>user.userId==senderId);
        console.log("receiver--socket->",senderId,receiverId)
        if(receiver){
            io.to(receiver.socketId).to(sender.socketId).emit('getMessage',{
                senderId,
                message,
                conversationId,
                receiverId
            });
        }
        else{
            io.to(sender.socketId).emit('getMessage',{
                senderId,
                message,
                conversationId, 
                receiverId
            });
        }
    });
    //io.emit('getUser',socket.userId);
})


app.post('/api/register',async(req,res,next)=>{
    try{
    const {fullName,email,password}=req.body;

    if(!fullName||!email||!password){
        res.status(400).send("please fill all required fields");
    }
    else{
        const isAlreadyExist= await Users.findOne({email:email});
        if(isAlreadyExist){
            res.status(400).send('user already exists');
        }
        else{
            const newUser=new Users({fullName,email});
            bcryptjs.hash(password,10,(err,hashedPassword)=>{
                newUser.set('password',hashedPassword);
                newUser.save();
                next();
            })
            res.status(200).send('user was saved successfully');
        }
    }
    }
    catch(error){
        console.log(error);
    }
})

app.post('/api/login',async(req,res,next)=>{
    try{
        const {email,password}=req.body;
        if(!email||!password){
            res.status(400).send("please fill all required fields");
        }
        else{
            const user=await Users.findOne({email});
            if(!user){
                res.status(400).send("user doesnt exist");
            }
            else{
                const validateUser=await bcryptjs.compare(password,user.password);
                if(!validateUser){
                    res.status(400).send("incorrect password");
                }
                else{
                    const payload={
                        userId:user._id,
                        email:user.email
                    }
                    const JWT_SECRET_KEY=process.env.JWT_SECRET_KEY || "THIS IS A JWT_SECRET_KEY";

                    jwt.sign(payload,JWT_SECRET_KEY,{expiresIn:84600},async(err,token)=>{
                        await Users.updateOne({_id:user._id},{
                            $set:{token}}
                            )
                        user.save();
                        next();
                    })

                    res.status(200).json({user,token:user.token});
                }
            }
        }
    }
    catch(error){

    }
})

app.post('/api/conversation',async(req,res)=>{
    try{
        const {senderId,receiverId}=req.body;
        const newConversation=new Conversations({members:[senderId,receiverId]});
        await newConversation.save();
        res.status(200).send('conversation saved successfully')
    }
    catch(error){
        console.log(error,'error');
    }
})

app.get('/api/conversation/:userid',async(req,res)=>{
    try{
    const userId=req.params.userid;
    const conversation=await Conversations.find({members: {$in: [userId]}});
    const conversationUserData=Promise.all(conversation.map(async(conversation)=>{
        const receiverId=conversation.members.find((member)=>String(member).trim()!=String(userId).trim());
        
        if (receiverId && mongoose.Types.ObjectId.isValid(receiverId)) {
            const user = await Users.findById(receiverId);
            return { user: { receiverId: user._id, username: user.fullName, email: user.email }, conversation_id: conversation._id };
        } else {
            console.log('Invalid ObjectId:', receiverId);
            return null;
        }

        const user=await Users.findById(receiverId);
        return {user:{receiverId:user._id,username:user.fullName,email:user.email},conversation_id:conversation._id};
    }));
    res.status(200).json(await conversationUserData);
    }
    catch(error){
        console.log(error);
    }

})

app.post('/api/message',async(req,res)=>{
    try{
    const {conversationId,senderId,message,receiverId=''}=req.body;
    if(!senderId || !message) return res.status(400).send("provide appropriate details");
    console.log(conversationId,'-',senderId,'-',receiverId,'-',message);
    if(conversationId==='new'){
        const newConversation=new Conversations({members:[senderId,receiverId]});
        newConversation.save();
        const newMessage=new Messages({conversationId:newConversation._id,senderId,message});
        await newMessage.save();
    }
    else{
        const newMessage=new Messages({conversationId,senderId,message});
        await newMessage.save();
    }
    return res.status(200).json({'data saved':'succcess'});
    }
    catch(error){
        console.log(error);
    }
})


//pulls the message history between two users sharing the same conversation id
app.get('/api/message/:conversationId',async(req,res)=>{
    try{
        const checkMessages=async(conversationId)=>{
            const messages=await Messages.find({conversationId});
            const messageUserData=await Promise.all(messages.map(async(message)=>{
                
                const user=await Users.findById(message.senderId);
                return {user:{id:user._id,username:user.fullName,email:user.email,convid:conversationId},message:message.message};
            }))
            res.status(200).json(messageUserData);
            }


        const conversationId=req.params.conversationId;
        //to check whether chosen user has a previous conversation or not
        if(conversationId==='new') {
            const checkConversationsId=await Conversations.find({members:{$all:[req.query.senderId,req.query.receiverId]}});
            console.log("sender->",req.query.senderId,"receiver->",req.query.receiverId)
            if(await checkConversationsId.length>0){ 
                checkMessages(checkConversationsId[0]._id);
            }
            else{
                console.log("new conversation");
                return res.status(200).json([]);
            }  
        }
        else{
            checkMessages(conversationId);
        }
   // const messages=await Messages.find({conversationId});
   // const messageUserData=Promise.all(messages.map(async(message)=>{
   //     const user=await Users.findById(message.senderId);
   //     return {user:{id:user._id,username:user.fullName,email:user.email},message:message.message};
   // }));
   // res.status(200).json(await messageUserData);
    }
    catch(error){
        console.log(error);
    }

})

app.get('/api/users/:userId',async(req,res)=>{
    try{
        const userId=req.params.userId;
        const user=await Users.find({_id:{ $ne:userId}});
        const UserData=Promise.all(user.map(async(user1)=>{
            return {user:{username:user1.fullName,email:user1.email},_id:user1._id};
        }));
        res.status(200).json(await UserData);
    }
    catch(error){
        console.log(error);
    }
})

app.listen(port,()=>{
    console.log("listening"+port);
});