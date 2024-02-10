import React, { useEffect, useRef, useState } from "react";
import Myuser from '../../assets/user-logo.png';
import bg from '../../assets/bg-second.jpg';
import bgchat from '../../assets/bg-1.jpg';
import Input from "../../components/input";
import {io} from 'socket.io-client';

const Dashboard=()=>{

    useEffect(()=>{
        const loggedUser=JSON.parse(localStorage.getItem('user:details'));
        console.log('user_id----->>>',loggedUser._id);
        const fetchConversation=async()=>{

            const res=await fetch(`http://localhost:8000/api/conversation/${loggedUser._id}`,{
                method:'GET',
                headers:{
                    'Content-Type':'application/json'
                },

            });
            const resdata=await res.json();
            console.log('fetch conversation->',resdata);

               // Filter out null values from the response
            const filteredConversations = resdata.filter(conversation => conversation !== null);

            setConversations(filteredConversations);
        }
        fetchConversation();
    },[]);

    //fetch the current user data from local storage
    const [user,setItem]=useState(JSON.parse(localStorage.getItem('user:details')));
    const [Conversations,setConversations]=useState([]);
    const [messages,setMessages]=useState({});
    const [message,setMessage]=useState('');
    const [socket,setSocket]=useState(null);
    const [currentConversation,setConv]=useState(null);
    //to fetch all the user from the database
    const [users,setUsers]=useState([]);
    const messageRef=useRef()

    useEffect(()=>{
        setSocket(io('http://localhost:8080'))
    },[])
    
    useEffect(()=>{
        socket?.emit('addUser',user?._id);
        socket?.on('getUsers',users=>{
            console.log("active users->>>>>>>>>>>>>>>>",users);
        })

        socket?.on('getMessage',data=>{
            console.log('data--------------------------------------------------',data);
            setMessages(prev=>({
                ...prev,
                messages:[...(prev.messages || []),{user:{id:data?.senderId,convid:data?.conversationId},message:data.message}]
            }));
            console.log("socket -----data--->",{user:{id:data?.user?._id,username:data?.user?.fullName,email:data?.user?.email},message:data.message});
        })
    },[socket])

    useEffect(()=>{
        messageRef?.current?.scrollIntoView({behavior:'smooth'})
    },[messages?.messages])

    console.log('user->',user);
    console.log('messages->',messages);
    console.log('current users->',users);
    console.log('conversations->',Conversations);

    //use effect to get all user data
    useEffect(()=>{
        const fetchUsers=async()=>{
            const res=await fetch(`http://localhost:8000/api/users/${user._id}`,{ 
                method:'GET',
                headers:{
                    'Content-Type':'application/json'
                }
             }  );
             const resdata=await res.json();
             setUsers(resdata);
        }
        fetchUsers();
    },[]);


    //function to fetch messages from the selected user
    const fetchMessages=async(conversationId,receiver)=>{
        const res=await fetch(`http://localhost:8000/api/message/${conversationId}?senderId=${user?._id}&receiverId=${receiver?.receiverId}`,{
            method:'GET',
            headers:{
                'Content-Type':'application/json'
            },
        })
        setConv(conversationId);
        const resdata=await res.json();
        console.log('resdata->>',resdata,"conversationId-",conversationId);
        if(resdata.length>0){
            console.log('-',resdata[0].user?.convid,"-");
            setMessages({messages:resdata,user:receiver,conversationId:resdata[0].user?.convid});
        }
        else{
            setMessages({messages:resdata,user:receiver,conversationId});
        }
    }

    //function to send message
    const sendMessage=async()=>{


        socket?.emit('sendMessage',{
            conversationId:messages?.conversationId,
            senderId:user?._id,
            message,
            receiverId:messages?.user?.receiverId
        })

        console.log('receiver adress-',messages.user.receiverId);
        const res=await fetch('http://localhost:8000/api/message',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(
                {
                    conversationId:messages?.conversationId,
                    senderId:user?._id,
                    message,
                    receiverId:messages?.user?.receiverId
                }
            )
        })
        const resdata=await res.json();
        console.log('response->',resdata);
        setMessage('');
    }

    return(
        <div className="w-screen flex" style={{ backgroundImage: `url(${bgchat})`,backgroundSize:'cover'}}>
            <div className="w-[25%] h-screen bg-gray-800 text-white bg-opacity-0">
                <div className="flex items-center bg-[#222] rounded-xl m-2 p-4 border-emerald-500 border-2 ">
                <div className="pl-2"><img src={Myuser} width={44} height={44}/></div>
                    <div className="pl-6">
                        <h3 className="text-xl">{user?.fullName}</h3>
                        <p>My account</p>
                    </div>
                </div>
                <div>
                    <div className="bg-[#222] border-t-2 border-t-sky-500 p-4 mt-2 mb-0 rounded-lg">Messages:</div>
                    {
                        Conversations.length>0 ?
                            Conversations.map((conversation)=>{
                                return(
                                    <div className="flex items-center bg-[rgba(255, 255, 255, 0.2)] backdrop-blur-lg rounded-lg m-2 p-4 border-b-2 overflow-y-scroll scrollbar-none border-gray-400 cursor-pointer" 
                                    onClick={()=>fetchMessages(conversation.conversation_id,conversation?.user)}>
                                    <div className="pl-2"><img src={Myuser} width={44} height={44}/></div>
                                    <div className="pl-6">
                                    <h3 className="text-lg">{conversation?.user?.username}</h3>
                                    <p>{conversation?.user?.email}</p>
                                    </div>
                                    </div>
                                )
                            }):<div className=" mt-3 pt-2 flex items-center justify-center bold text-xl ">No conversations yet..</div>
                    }
                </div>
            </div>
            <div  className="w-[50%] h-screen text-white flex flex-col items-center bg-gray-600" style={{ backgroundImage: `url(${bg})`,backgroundSize:'cover'}}>
                {messages?.user?.username &&
                <div className="w-[40%] h-[70px] flex rounded-full bg-gray-800 m-2 p-2 border-sky-500 border-2 absolute">
                    <div className="pl-4 pt-1 cursor-pointer"><img src={Myuser} width={44} height={44}/></div>
                    <div className="pl-4 mr-auto">
                        <h3 className="text-lg font-semibold">{messages.user.username}</h3>
                        <p>{messages.user.email}</p>
                    </div>
                </div>
                }
                
                <div className="h-[90%] w-full border-0 border-white overflow-y-scroll scrollbar-none">
                    <div className="h-[11%]"></div>
                    <div className="">
                        {
                            messages?.messages?.length>0?
                            messages.messages.map(({message,user:{id,convid}={}})=>{
                                if(id===user?._id)
                                {
                                    return(
                                        <>
                                        <div  className="max-w-[50%] text-white bg-[#31986f] rounded-xl ml-auto mr-3 p-2 m-2">
                                            {message}
                                        </div>
                                        <div ref={messageRef}></div>
                                        </>
                                    )
                                }
                                else{
                                    console.log("currrent---------->",convid,currentConversation);
                                    if(convid==currentConversation){
                                    return(
                                        <>
                                        <div className="max-w-[50%] text-white bg-gray-800 rounded-xl p-2 m-2">
                                            {message}
                                        </div>
                                        <div ref={messageRef}></div>
                                        </>
                                    )}
                                }
                            }):<div className=" mt-3 pt-2 flex items-center justify-center bold text-xl ">No Messages yet..</div>
                        }
                    </div>
                </div>
                 {messages?.user?.username &&
                <div className="h-[10%] w-full flex">
                    <Input placeholder="enter a message" value={message} onchange={(e)=>setMessage(e.target.value)} name="message" type='text' classname="m-0 mb-3.5 p-4 w-[95%] rounded-xl" inputclassname="flex justify-start items-center p-0 w-[95%] mr-0"/>
                    <div className={`ml-auto pt-4 mt-4 mr-5 cursor-pointer ${!message && 'pointer-events-none'}`} onClick={()=>{sendMessage()}}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-send" width="29" height="29" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#ffffff" fill="none" strokeLinecap="round" strokeLinejoin="round">
                         <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                         <path d="M10 14l11 -11" />
                         <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
                         </svg>
                    </div>
                </div>
                }
                </div> 
            <div  className="w-[25%] h-screen bg-gray-800 text-white bg-opacity-0 overflow-y-scroll scrollbar-none">
                 <div className="bg-[#222] border-t-2 border-b-2 border-sky-500 p-4 rounded-lg">Users:</div>
                 {
                        users.length>0 ?
                            users.map((userdata)=>{
                                {console.log(userdata)};
                                return(
                                    <div className="flex items-center bg-[rgba(255, 255, 255, 0.2)] backdrop-blur-lg rounded-lg m-2 p-4 border-b-2 border-gray-400 cursor-pointer" 
                                    onClick={()=>fetchMessages('new',{receiverId:userdata._id,username:userdata.user.username,email:userdata.user.email})}>
                                    <div className="pl-2"><img src={Myuser} width={44} height={44}/></div>
                                    <div className="pl-6">
                                    <h3 className="text-lg">{userdata?.user?.username}</h3>
                                    <p>{userdata?.user?.email}</p>
                                    </div>
                                    </div>
                                )
                            }):<div className=" mt-3 pt-2 flex items-center justify-center bold text-xl ">No conversations yet..</div>
                    }
            </div>
        </div>
    )
}

export default Dashboard;