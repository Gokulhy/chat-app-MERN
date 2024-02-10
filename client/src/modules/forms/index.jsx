import Input from '../../components/input/index.jsx';
import Button from '../../components/button/index.jsx';
import React,{ useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bg from '../../assets/bg-1.jpg'

const Myform=({
    issignedin=false
})=>{
    const[data,setData]=useState(
        {
            ...(!issignedin && {
                fullName:""
            }),
            email:"",
            password:""
        }
    )
    console.log(data,issignedin);
    const navigate=useNavigate();

    const handleSubmit=async(e)=>{
        console.log("data->",JSON.stringify(data));
        e.preventDefault();
        const res=await fetch(`http://localhost:8000/api/${issignedin?'login':'register'}`,{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body: JSON.stringify(data)
        });

        if(res.status==400){
            alert("invalid credentials");
        }

        const resdata=await res.json();
        console.log('data->',resdata);
        if(resdata.token){
            localStorage.setItem('user:token',resdata.token);
            localStorage.setItem('user:details',JSON.stringify(resdata.user));
            navigate('/');
        }
        else{
            alert(resdata);
        }
    }

    return(
        <div className='bg-other h-screen flex justify-center items-center' style={{ backgroundImage: `url(${bg})`,backgroundSize:'cover'}}>
        <div className="bg-white w-[500px] h-[600px] shadow-lg rounded-lg flex flex-col justify-center items-center">
            <img src='/bread-logo.png' className='w-32 h-32' />
            <div className="text-3xl font-sans font-bold pb-1">{issignedin?'Welcome back':'Hello there..'}</div>
            <div className="text-2xl font-sans font-normal m-0 pb-2">{issignedin?' Sign in to continue ':'Sign up to get started now'}</div>

            <form id='myform' className='text-center' onSubmit={(e)=>handleSubmit(e)}>
                {!issignedin && <Input label='Full name:' name='name' placeholder='enter your name' value={data.fullName}
                onchange={(e)=>setData({...data,fullName:e.target.value})}/>}
                <Input label='email:' name='email' type='email' isrequired={true} placeholder='enter your email' value={data.email}
                onchange={(e)=>setData({...data,email:e.target.value})}/>
                <Input label='password:' name='password' type='password' isrequired={true} placeholder='enter your password' value={data.password}
                onchange={(e)=>setData({...data,password:e.target.value})} /> 
                <Button label={issignedin?'Sign in':'Sign up'} type='submit'/>
            </form>
            
            <div className='pt-4'>{issignedin?'Dont have an account ':'Already have an account '}
            <span className='text-secondary cursor-pointer underline' onClick={()=>navigate(`/users/${issignedin ? 'sign_up' : 'sign_in'}`)}>{issignedin?'Sign up':'Sign in'}</span></div>
        </div> 
        </div>
        )
}
  
export default Myform;