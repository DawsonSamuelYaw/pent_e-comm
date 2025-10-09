import React from 'react';
import Cart from '../components/cart';
import Home from '../components/home';
import Month from '../components/month';
import Pro from '../components/pro';
import GiveLifeForm from '../components/GiveLifeForm';  // import it

const Homepage = () => {
  return (
    <>
      <Home />
      <Cart />
      <Pro />
      <Month />
      {/* <GiveLifeForm /> Add form here */}
    </>
  );
};

export default Homepage;
