import React from 'react'
import { Outlet } from 'react-router-dom'
import Footer from '../components/footer'
import Header from '../components/header'
 const mainlayout = () => {
  return (
    <>
    <Header/>
    <Outlet/>
    <Footer/>
    </>
  )
}
export default mainlayout