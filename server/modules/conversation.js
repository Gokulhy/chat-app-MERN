const mongoose=require('mongoose');

const conversationSchema=mongoose.Schema({
    members:{
        type:Array,
        required:true
    },
});

const Conversation=mongoose.model('conversation',conversationSchema);

module.exports=Conversation;

