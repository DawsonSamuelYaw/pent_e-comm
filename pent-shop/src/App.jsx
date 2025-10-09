import { 
  createBrowserRouter, 
  createRoutesFromElements, 
  Route, 
  RouterProvider, 
  Navigate 
} from 'react-router-dom';

import MainLayouts from './layouts/mainlayout';
import Homepage from './pages/homepage';
import Loginpage from './pages/loginpage';
import Page4 from './pages/page4';
import Signpage from './pages/signpage';
import ShowCart from './components/showCart';
import Cart from './components/cart';
import Profile from './components/Profile';
import Checkout from './components/checkout';
import OrderSuccess from './components/OrderSuccess';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ProductDetails from './components/ProductDetails';
import ForgotPassword from "./components/ForgotPassword";
import GiveLifeAccess from './components/GiveLifeAccess';
import GiveLifeForm from './components/GiveLifeForm';
import GiveLifeDashboard from './components/GiveLifeDashboard';

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        {/* Main user routes */}
        <Route path="/" element={<MainLayouts />}>
          <Route index element={<Homepage />} />
          <Route path="sign" element={<Loginpage />} />
          <Route path="login" element={<Signpage />} />
          <Route path="*" element={<Page4 />} />
          <Route path="carts" element={<Cart />} />
          <Route path="cart" element={<ShowCart />} />
          <Route path="profile" element={<Profile />} />
          <Route path="success/:orderReference" element={<OrderSuccess />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="give-life-form" element={<GiveLifeForm />} />
          <Route
            path="give-life-dashboard"
            element={
              <GiveLifeAccess>
                <GiveLifeDashboard />
              </GiveLifeAccess>
            }
          />
        </Route>

        {/* Admin login & protected dashboard */}
        <Route path="admin-login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            localStorage.getItem("adminLoggedIn") === "true"
              ? <AdminDashboard />
              : <Navigate to="/admin-login" replace />
          }
        />
      </>
    )
  );

  return <RouterProvider router={router} />;
}

export default App;
