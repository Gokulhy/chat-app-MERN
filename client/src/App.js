import logo from './logo.svg';
import './App.css';
import {Routes,Route,Navigate, redirect} from 'react-router-dom';

import Myform from './modules/forms/index.jsx';
import Dashboard from './modules/dashboard/index.jsx';

const ProtectedRoute=({children})=>{
  const Loggedin=localStorage.getItem('user:token') !==null || false;

  if(!Loggedin && window.location.pathname==='/'){
    return <Navigate to={'/users/sign_in'} />;
  }
  if(Loggedin && ['/users/sign_in','/users/sign_up'].includes(window.location.pathname))
  {
    return <Navigate to={'/'} />
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path='/' element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }/>
      <Route path='/users/sign_in' element={
        <ProtectedRoute>
          <Myform issignedin={true} />
        </ProtectedRoute> } />
      <Route path='/users/sign_up' element={
          <ProtectedRoute>
            <Myform issignedin={false}/>
          </ProtectedRoute>
          }/>
    </Routes>
  );
}

export default App;
